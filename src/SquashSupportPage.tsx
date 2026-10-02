import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  FileText,
  HelpCircle,
  LifeBuoy,
  Lock,
  Mail,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from 'lucide-react';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import { useAuth } from './auth';
import { createSupportTicket, getMySupportTickets, type SupportCategory, type SupportTicket } from './lib/supportApi';
import { usePageMeta } from './hooks/usePageMeta';

type TopicCategory = {
  id: SupportCategory;
  name: string;
  badge: string;
  description: string;
  icon: any;
  accent: string;
  iconBg: string;
};

const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    id: 'payout',
    name: 'Tester Payouts',
    badge: 'Weekly EFT',
    description: 'Weekly bank transfers, minimum threshold (R50 ZAR), & account verification.',
    icon: Sparkles,
    accent: 'text-[#e63946]',
    iconBg: 'bg-[#1d1d1f] text-white shadow-2xs',
  },
  {
    id: 'job',
    name: 'Testing Jobs & Devices',
    badge: 'Real Devices',
    description: 'Posting jobs, targeting Android/iOS/Web, and test slot limits.',
    icon: Zap,
    accent: 'text-[#e63946]',
    iconBg: 'bg-[#1d1d1f] text-white shadow-2xs',
  },
  {
    id: 'report',
    name: 'Bug Reports & Evidence',
    badge: 'QA Quality',
    description: 'Screen recordings, reproduction steps, severity levels, & reviews.',
    icon: FileText,
    accent: 'text-[#e63946]',
    iconBg: 'bg-[#1d1d1f] text-white shadow-2xs',
  },
  {
    id: 'safety',
    name: 'Disputes & Arbitration',
    badge: 'Admin Review',
    description: '48-hour report dispute reviews, NDA confidentiality, & safety.',
    icon: ShieldCheck,
    accent: 'text-[#e63946]',
    iconBg: 'bg-[#1d1d1f] text-white shadow-2xs',
  },
  {
    id: 'account',
    name: 'Account & Login',
    badge: 'Auth & Roles',
    description: 'Password resets, Google/GitHub sign-in, and switching Developer/Tester roles.',
    icon: UserCheck,
    accent: 'text-[#e63946]',
    iconBg: 'bg-[#1d1d1f] text-white shadow-2xs',
  },
  {
    id: 'payment',
    name: 'Developer Billing',
    badge: 'ZAR Invoicing',
    description: 'Funding account balance, VAT receipts, and unspent budget returns.',
    icon: CreditCard,
    accent: 'text-[#e63946]',
    iconBg: 'bg-[#1d1d1f] text-white shadow-2xs',
  },
  {
    id: 'privacy',
    name: 'POPIA & Privacy',
    badge: 'Data Security',
    description: 'Protection of Personal Information Act compliance & data rights.',
    icon: Lock,
    accent: 'text-[#e63946]',
    iconBg: 'bg-[#1d1d1f] text-white shadow-2xs',
  },
  {
    id: 'other',
    name: 'General Inquiries',
    badge: 'Help Desk',
    description: 'Partnerships, press inquiries, and general support assistance.',
    icon: HelpCircle,
    accent: 'text-[#e63946]',
    iconBg: 'bg-[#1d1d1f] text-white shadow-2xs',
  },
];

type FAQItem = {
  id: string;
  category: SupportCategory;
  question: string;
  answer: string;
  tags: string[];
};

const KNOWLEDGE_BASE_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'payout',
    question: 'How fast do Testers receive earnings payouts?',
    answer: 'Approved report earnings are disbursed weekly directly to your verified South African bank account via EFT. Minimum payout threshold is R50 ZAR.',
    tags: ['payout', 'bank', 'eft', 'zar', 'weekly'],
  },
  {
    id: 'faq-2',
    category: 'safety',
    question: 'What happens if a Developer rejects my bug report?',
    answer: 'If you believe your report met all test brief requirements, click "Dispute Rejection" within 48 hours. SQUASH QA admins will review your submitted video evidence and device logs to make a final binding decision.',
    tags: ['dispute', 'rejection', 'evidence', 'admin', 'video'],
  },
  {
    category: 'job',
    id: 'faq-3',
    question: 'How do Developers target specific real devices?',
    answer: 'When posting a job, Developers choose target operating systems (Android, iOS, Web) and specific device demographics (e.g. Samsung Galaxy, iPhone, Chrome). SQUASH matches your job only to testers with those physical devices.',
    tags: ['job', 'devices', 'android', 'ios', 'web'],
  },
  {
    id: 'faq-4',
    category: 'privacy',
    question: 'Is my unreleased app binary kept safe and confidential?',
    answer: 'Yes. All Testers sign a strict Non-Disclosure Agreement (NDA) and Tester Code of Conduct before gaining access. Distributing or screenshotting pre-release apps outside SQUASH is illegal and results in immediate ban.',
    tags: ['nda', 'confidentiality', 'binary', 'privacy', 'popia'],
  },
  {
    id: 'faq-5',
    category: 'account',
    question: 'How do I switch between Developer and Tester accounts?',
    answer: 'You can switch roles anytime from the account dropdown menu at the top right of your navigation header without logging out.',
    tags: ['roles', 'account', 'developer', 'tester', 'switch'],
  },
  {
    id: 'faq-6',
    category: 'payment',
    question: 'What happens to unused budget when a testing job completes?',
    answer: 'Any unspent funds allocated to unclaimed tester slots are automatically returned to your available Developer account balance immediately upon job completion or cancellation.',
    tags: ['billing', 'refund', 'balance', 'budget', 'developer'],
  },
];

export default function SquashSupportPage({ embedded = false }: { embedded?: boolean }) {
  usePageMeta({
    title: 'Help Center & Support Desk',
    description: 'Find answers, browse knowledge base articles, or open a tracked support ticket with the SQUASH team.',
    path: '/contact',
  });

  const { session, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'kb' | 'ticket'>('kb');
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
  // Ticket form state
  const [ticketCategory, setTicketCategory] = useState<SupportCategory>('account');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (!session?.userId) return;
    let active = true;
    getMySupportTickets()
      .then((items) => {
        if (active) setTickets(items);
      })
      .catch(() => {
        // The knowledge base remains available if ticket history cannot load.
      });
    return () => {
      active = false;
    };
  }, [session?.userId]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@squashqa.co.za');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const filteredFaqs = useMemo(() => {
    return KNOWLEDGE_BASE_FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!subject.trim() || subject.trim().length < 4) {
      setError('Please enter a clear subject line for your ticket.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Please describe your request in at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSupportTicket({
        category: ticketCategory,
        subject: subject.trim(),
        description: description.trim(),
      });
      setSubject('');
      setDescription('');
      setNotice('Support ticket created successfully! Our team will respond shortly.');
      setTickets((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      setActiveTab('ticket');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit support request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={embedded ? 'text-slate-900' : 'min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-emerald-100'}>
      {!embedded ? <PublicHeader /> : null}

      {/* Header Banner */}
      <div className={embedded
        ? 'rounded-[24px] border border-white/80 bg-white/72 px-4 py-8 shadow-[0_14px_34px_rgba(60,55,54,0.075)] backdrop-blur-xl sm:px-6'
        : 'border-b border-slate-200/70 bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8'}>
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3.5 py-1 text-xs font-bold text-[#e63946]">
                <LifeBuoy className="h-3.5 w-3.5 text-[#e63946]" />
                <span>SQUASH Help & Support Desk</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                How can we help you?
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl">
                Browse our knowledge base or open a tracked support ticket with our team.
              </p>
            </div>

            {/* Direct Contact Pill Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 shrink-0 sm:max-w-xs space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-[#e63946]">
                  <Mail className="h-4 w-4" />
                  Direct Email
                </span>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-[#e63946]">
                  &lt; 2h Response
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <a href="mailto:support@squashqa.co.za" className="text-xs font-extrabold text-slate-900 hover:text-[#e63946] underline">
                  support@squashqa.co.za
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                  title="Copy email address"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              {copiedEmail ? <div className="text-[10px] font-bold text-[#e63946]">Copied to clipboard!</div> : null}
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative pt-2 max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge base articles, payouts, job rules, NDA, or disputes..."
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 py-3.5 pl-11 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#e63946] focus:bg-white focus:ring-4 focus:ring-rose-100 shadow-2xs"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            ) : null}
          </div>

          {/* Navigation Mode Tabs */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('kb')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition apple-press-effect ${
                activeTab === 'kb'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Knowledge Base & FAQs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ticket')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition apple-press-effect ${
                activeTab === 'ticket'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Submit & Track Support Ticket</span>
              {tickets.length > 0 ? (
                <span className="rounded-full bg-[#e63946] px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                  {tickets.length}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      <div role="main" className={embedded ? 'mx-auto mt-6 max-w-5xl space-y-12' : 'mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-12'}>
        {/* MODE 1: KNOWLEDGE BASE & FAQS */}
        {activeTab === 'kb' ? (
          <div className="space-y-10">
            {/* Topic Category Cards Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Browse by Topic</h2>
                {selectedCategory !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    View All Categories
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {TOPIC_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                      className={`text-left apple-interactive-card p-4 transition-all duration-200 ${
                        isSelected
                          ? 'border-[#e63946] ring-2 ring-[#e63946]/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cat.iconBg}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <span className="rounded-full bg-[#f5f5f7] border border-black/[0.04] px-2 py-0.5 text-[10px] font-extrabold text-[#1d1d1f]">
                          {cat.badge}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xs font-extrabold text-[#1d1d1f]">{cat.name}</h3>
                      <p className="mt-1 text-[11px] text-[#86868b] font-normal leading-relaxed line-clamp-2">
                        {cat.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Knowledge Base FAQs List */}
            <div className="apple-interactive-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-black/[0.06] pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#1d1d1f]">Frequently Asked Questions</h2>
                  <p className="text-xs text-[#86868b] font-normal">
                    Showing {filteredFaqs.length} article{filteredFaqs.length === 1 ? '' : 's'}
                    {selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="rounded-xl border border-black/[0.06] bg-[#f5f5f7]/60 overflow-hidden transition"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="flex w-full items-center justify-between p-4 text-left font-extrabold text-[#1d1d1f] text-xs sm:text-sm hover:bg-[#f5f5f7] transition"
                      >
                        <span className="flex items-center gap-2.5">
                          <HelpCircle className="h-4 w-4 text-[#e63946] shrink-0" />
                          <span>{faq.question}</span>
                        </span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-[#86868b] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#e63946]' : ''}`} />
                      </button>

                      {isOpen ? (
                        <div className="px-4 pb-4 text-xs text-[#86868b] leading-relaxed font-normal border-t border-black/[0.06] pt-3">
                          <p>{faq.answer}</p>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-[#86868b] font-semibold border-t border-black/[0.04] pt-2">
                            <span>Category: {faq.category}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setTicketCategory(faq.category);
                                setSubject(`Help with ${faq.question}`);
                                setActiveTab('ticket');
                              }}
                              className="text-[#e63946] font-bold hover:underline inline-flex items-center gap-1"
                            >
                              Still need help? Open a Ticket <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {filteredFaqs.length === 0 ? (
                  <div className="p-8 text-center text-xs font-semibold text-[#86868b]">
                    No knowledge base articles matched your search. Switch to "Submit & Track Support Ticket" above to get direct help from our team!
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          /* MODE 2: SUBMIT & TRACK SUPPORT TICKET */
          <div className="space-y-8">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-2xs">
                Loading Support Ticket System...
              </div>
            ) : !session ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 text-center max-w-md mx-auto shadow-2xs space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white border border-[#1d1d1f]">
                  <Mail className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Sign in to open a support ticket</h2>
                <p className="text-xs text-slate-600 font-medium">
                  Signing in connects your ticket directly to your SQUASH account so you can track support responses live.
                </p>
                <div className="pt-2">
                  <a
                    href="/login?next=%2Fcontact"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition apple-press-effect"
                  >
                    Sign In to SQUASH
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-12">
                {/* Form Column */}
                <div className="lg:col-span-7">
                  <form onSubmit={submitTicket} className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">New Support Ticket</h2>
                        <p className="text-xs text-slate-500 font-medium">Fill in your request details</p>
                      </div>
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-extrabold text-[#e63946] border border-rose-100">
                        Tracked & Verified
                      </span>
                    </div>

                    {error ? (
                      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    ) : null}

                    {notice ? (
                      <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-xs font-bold text-[#e63946]">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{notice}</span>
                      </div>
                    ) : null}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          value={ticketCategory}
                          onChange={(e) => setTicketCategory(e.target.value as SupportCategory)}
                          className="w-full appearance-none rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-[#e63946] focus:ring-2 focus:ring-rose-100"
                        >
                          {TOPIC_CATEGORIES.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        maxLength={160}
                        placeholder="Brief summary of your question or issue"
                        className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 outline-none focus:border-[#e63946] focus:ring-2 focus:ring-rose-100 placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Details & Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={5000}
                        rows={6}
                        placeholder="Provide details (job title, payout request, device details, report ID)..."
                        className="w-full rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs sm:text-sm text-slate-800 outline-none focus:border-[#e63946] focus:ring-2 focus:ring-rose-100 placeholder:text-slate-400"
                      />
                      <div className="text-right text-[10px] text-slate-400 mt-1 font-semibold">
                        {description.length}/5000 characters
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e63946] py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#d62828] transition disabled:opacity-50 apple-press-effect"
                    >
                      <Send className="h-4 w-4" />
                      <span>{submitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}</span>
                    </button>
                  </form>
                </div>

                {/* Ticket History Column */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h2 className="text-base font-bold text-slate-900">Your Support Tickets</h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                        {tickets.length} Ticket{tickets.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {tickets.map((ticket) => {
                        const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

                        return (
                          <div key={ticket.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-xs font-bold text-slate-900 leading-snug">{ticket.subject}</h3>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold capitalize ${
                                  isResolved ? 'bg-rose-100 text-[#e63946]' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {ticket.status.replace('_', ' ')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                              <span className="capitalize">{ticket.category}</span>
                              <span>·</span>
                              <span>{new Date(ticket.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })}</span>
                            </div>

                            {ticket.adminNote ? (
                              <div className="mt-2 rounded-xl bg-white p-3 text-xs text-slate-700 border border-slate-200/80 space-y-1">
                                <div className="font-bold text-[#e63946] flex items-center gap-1">
                                  <Sparkles className="h-3.5 w-3.5 text-[#e63946]" />
                                  <span>SQUASH Response:</span>
                                </div>
                                <p className="leading-relaxed">{ticket.adminNote}</p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}

                      {tickets.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs font-semibold text-slate-500">
                          No active tickets yet. Fill out the form on the left to get direct help!
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!embedded ? <PublicFooter /> : null}
    </div>
  );
}
