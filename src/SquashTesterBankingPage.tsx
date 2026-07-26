import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import {
  getBankingDocumentUrl,
  getTesterBankingDetails,
  saveTesterBankingDetails,
  type BankAccountType,
  type BankingVerificationStatus,
} from './lib/bankingApi';

type BankingForm = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType: BankAccountType;
  branchCode: string;
};

const emptyForm: BankingForm = {
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  accountType: 'cheque',
  branchCode: '',
};

function verificationMessage(status: BankingVerificationStatus | 'not_submitted') {
  if (status === 'approved') {
    return {
      title: 'Banking details verified',
      body: 'Your EFT account is ready for scheduled Friday payouts.',
      className: 'border-green-200 bg-green-50 text-green-800',
      Icon: CheckCircle2,
    };
  }
  if (status === 'pending') {
    return {
      title: 'Verification pending',
      body: 'An administrator will review your banking details and supporting document.',
      className: 'border-amber-200 bg-amber-50 text-amber-800',
      Icon: Clock3,
    };
  }
  if (status === 'rejected' || status === 'changes_required') {
    return {
      title: 'Banking update required',
      body: 'Correct the requested information and upload a new supporting document.',
      className: 'border-red-200 bg-red-50 text-red-800',
      Icon: AlertTriangle,
    };
  }
  return {
    title: 'Banking details required',
    body: 'Submit your EFT account and proof of banking before requesting a payout.',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
    Icon: ShieldCheck,
  };
}

export default function SquashTesterBankingPage() {
  const { session } = useAuth();
  const [form, setForm] = useState<BankingForm>(emptyForm);
  const [proofDocument, setProofDocument] = useState<File | null>(null);
  const [submittedProof, setSubmittedProof] = useState<{ path: string; name: string } | null>(null);
  const [status, setStatus] = useState<BankingVerificationStatus | 'not_submitted'>('not_submitted');
  const [reviewNote, setReviewNote] = useState('');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!session?.userId) {
      setLoading(false);
      return;
    }
    getTesterBankingDetails(session.userId)
      .then((details) => {
        if (!mounted || !details) return;
        setForm({
          accountHolderName: details.accountHolderName,
          bankName: details.bankName,
          accountNumber: details.accountNumber,
          accountType: details.accountType,
          branchCode: details.branchCode,
        });
        setSubmittedProof({ path: details.proofDocumentPath, name: details.proofDocumentName });
        setStatus(details.verificationStatus);
        setReviewNote(details.verificationNote || '');
      })
      .catch((loadError) => {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Could not load banking details.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [session?.userId]);

  const complete = useMemo(
    () =>
      form.accountHolderName.trim().length >= 2
      && form.bankName.trim().length >= 2
      && /^\d{5,20}$/.test(form.accountNumber)
      && /^\d{6}$/.test(form.branchCode)
      && Boolean(proofDocument),
    [form, proofDocument],
  );

  const updateText = (field: keyof BankingForm, value: string) => {
    const nextValue = field === 'accountNumber'
      ? value.replace(/\D/g, '').slice(0, 20)
      : field === 'branchCode'
        ? value.replace(/\D/g, '').slice(0, 6)
        : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    setNotice('');
  };

  const submit = async () => {
    if (!session?.userId || !proofDocument || !complete) {
      setError('Complete every field and attach proof of banking or a bank statement.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await saveTesterBankingDetails({
        testerId: session.userId,
        ...form,
        proofDocument,
      });
      setStatus(result.verificationStatus);
      setReviewNote(result.verificationNote || '');
      setSubmittedProof({ path: result.proofDocumentPath, name: result.proofDocumentName });
      setProofDocument(null);
      setNotice('Banking details submitted securely for verification.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit banking details.');
    } finally {
      setSaving(false);
    }
  };

  const viewSubmittedProof = async () => {
    if (!submittedProof) return;
    const preview = window.open('', '_blank', 'noopener,noreferrer');
    try {
      const url = await getBankingDocumentUrl(submittedProof.path);
      if (preview) preview.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
    } catch (viewError) {
      preview?.close();
      setError(viewError instanceof Error ? viewError.message : 'Could not open the document.');
    }
  };

  const verification = verificationMessage(status);
  const StatusIcon = verification.Icon;

  return (
    <div className="mx-auto max-w-6xl text-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              <Wallet className="h-4 w-4" /> EFT payout setup
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Banking details</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Verified earnings are scheduled for payout by EFT every Friday.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/tester/earnings" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Back to earnings</a>
            <button type="button" disabled={!complete || saving || loading} onClick={submit} className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Submitting securely...' : 'Submit for verification'}
            </button>
          </div>
        </div>

        <div className={`mt-6 flex items-start gap-3 rounded-3xl border p-5 ${verification.className}`}>
          <StatusIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-bold">{verification.title}</div>
            <p className="mt-1 text-sm">{verification.body}</p>
            {reviewNote ? <p className="mt-2 text-sm font-semibold">Admin note: {reviewNote}</p> : null}
          </div>
        </div>
        {notice ? <p className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{notice}</p> : null}
        {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-50 text-green-700"><CreditCard className="h-5 w-5" /></span>
              <div><h2 className="text-xl font-bold">EFT account</h2><p className="text-sm text-slate-500">The account that should receive your payouts.</p></div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Account holder name</span><input value={form.accountHolderName} onChange={(event) => updateText('accountHolderName', event.target.value)} autoComplete="name" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" /></label>
              <label><span className="mb-2 block text-sm font-semibold">Bank name</span><input value={form.bankName} onChange={(event) => updateText('bankName', event.target.value)} placeholder="e.g. Capitec, FNB" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" /></label>
              <label><span className="mb-2 block text-sm font-semibold">Account type</span><select value={form.accountType} onChange={(event) => setForm((current) => ({ ...current, accountType: event.target.value as BankAccountType }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500"><option value="cheque">Cheque / Current</option><option value="savings">Savings</option><option value="transmission">Transmission</option></select></label>
              <label><span className="mb-2 block text-sm font-semibold">Account number</span><div className="relative"><input type={showAccountNumber ? 'text' : 'password'} value={form.accountNumber} onChange={(event) => updateText('accountNumber', event.target.value)} inputMode="numeric" autoComplete="off" className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-green-500" /><button type="button" onClick={() => setShowAccountNumber((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label={showAccountNumber ? 'Hide account number' : 'Show account number'}>{showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              <label><span className="mb-2 block text-sm font-semibold">Universal branch code</span><input value={form.branchCode} onChange={(event) => updateText('branchCode', event.target.value)} inputMode="numeric" placeholder="6 digits" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" /></label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-50 text-sky-700"><FileText className="h-5 w-5" /></span>
              <div><h2 className="text-xl font-bold">Supporting document</h2><p className="text-sm text-slate-500">Required for account verification.</p></div>
            </div>
            <label className="mt-6 flex cursor-pointer flex-col items-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center hover:border-green-400 hover:bg-green-50">
              <FileUp className="h-8 w-8 text-green-700" />
              <span className="mt-3 font-bold">Proof of banking or bank statement</span>
              <span className="mt-1 text-xs text-slate-500">PDF, PNG or JPEG · maximum 5 MB</span>
              <input type="file" accept="application/pdf,image/png,image/jpeg" className="hidden" onChange={(event) => { setProofDocument(event.target.files?.[0] || null); setError(''); }} />
            </label>
            {proofDocument ? <p className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{proofDocument.name}</p> : null}
            {submittedProof ? <button type="button" onClick={viewSubmittedProof} className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">View submitted document</button> : null}
            <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-sm leading-6 text-slate-200">
              <div className="flex gap-2 font-bold text-white"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />Private financial information</div>
              <p className="mt-2">Banking details and documents are restricted to you and authorized administrators for verification and EFT processing.</p>
            </div>
          </section>
        </div>
    </div>
  );
}
