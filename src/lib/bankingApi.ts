import { isSupabaseConfigured, supabase, SERVICE_UNAVAILABLE_MESSAGE } from './supabase';
import { hasExpectedFileSignature, type SafeFileKind } from './fileValidation';

export type BankingVerificationStatus = 'pending' | 'approved' | 'rejected' | 'changes_required';
export type BankAccountType = 'cheque' | 'savings' | 'transmission';

export type TesterBankingDetails = {
  testerId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType: BankAccountType;
  branchCode: string;
  proofDocumentPath: string;
  proofDocumentName: string;
  proofDocumentType: string;
  verificationStatus: BankingVerificationStatus;
  verificationNote: string | null;
  submittedAt: string;
  verifiedAt: string | null;
};

export type AdminBankingSubmission = TesterBankingDetails & {
  testerName: string;
  testerEmail: string;
};

type BankingRow = {
  tester_id: string;
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  account_type: BankAccountType;
  branch_code: string;
  proof_document_path: string;
  proof_document_name: string;
  proof_document_type: string;
  verification_status: BankingVerificationStatus;
  verification_note: string | null;
  submitted_at: string;
  verified_at: string | null;
};

function mapBankingDetails(row: BankingRow): TesterBankingDetails {
  return {
    testerId: row.tester_id,
    accountHolderName: row.account_holder_name,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountType: row.account_type,
    branchCode: row.branch_code,
    proofDocumentPath: row.proof_document_path,
    proofDocumentName: row.proof_document_name,
    proofDocumentType: row.proof_document_type,
    verificationStatus: row.verification_status,
    verificationNote: row.verification_note,
    submittedAt: row.submitted_at,
    verifiedAt: row.verified_at,
  };
}

export async function getTesterBankingDetails(testerId: string): Promise<TesterBankingDetails | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await (supabase.from('tester_banking_details') as any)
    .select('*')
    .eq('tester_id', testerId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBankingDetails(data as BankingRow) : null;
}

export async function saveTesterBankingDetails(input: {
  testerId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType: BankAccountType;
  branchCode: string;
  proofDocument: File;
}): Promise<TesterBankingDetails> {
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);

  const allowedTypes: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
  };
  const extension = allowedTypes[input.proofDocument.type];
  if (!extension) throw new Error('Upload a PDF, PNG or JPEG document.');
  if (!(await hasExpectedFileSignature(input.proofDocument, extension as SafeFileKind))) {
    throw new Error('The document contents do not match its declared file type.');
  }
  if (input.proofDocument.size > 5 * 1024 * 1024) {
    throw new Error('The banking document must be 5 MB or smaller.');
  }

  const cleanAccountNumber = input.accountNumber.replace(/\s/g, '');
  const cleanBranchCode = input.branchCode.replace(/\s/g, '');
  if (!/^\d{5,20}$/.test(cleanAccountNumber)) throw new Error('Enter a valid bank account number.');
  if (!/^\d{6}$/.test(cleanBranchCode)) throw new Error('The branch code must contain 6 digits.');

  const filePath = `${input.testerId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from('tester-banking-documents')
    .upload(filePath, input.proofDocument, { cacheControl: '3600', upsert: false });
  if (uploadError) throw new Error(`Could not upload the banking document: ${uploadError.message}`);

  const { data, error } = await (supabase.rpc as any)('save_tester_banking_details', {
    p_account_holder_name: input.accountHolderName.trim(),
    p_bank_name: input.bankName.trim(),
    p_account_number: cleanAccountNumber,
    p_account_type: input.accountType,
    p_branch_code: cleanBranchCode,
    p_proof_document_path: filePath,
    p_proof_document_name: input.proofDocument.name,
    p_proof_document_type: input.proofDocument.type,
  });

  if (error) {
    await supabase.storage.from('tester-banking-documents').remove([filePath]);
    throw error;
  }
  return mapBankingDetails(data as BankingRow);
}

export async function getBankingDocumentUrl(path: string) {
  const { data, error } = await supabase.storage
    .from('tester-banking-documents')
    .createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export async function getAdminBankingQueue(): Promise<AdminBankingSubmission[]> {
  if (!isSupabaseConfigured) return [];
  const { data: bankingRows, error } = await (supabase.from('tester_banking_details') as any)
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  if (!bankingRows?.length) return [];

  const testerIds = bankingRows.map((row: BankingRow) => row.tester_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', testerIds);
  if (profileError) throw profileError;
  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));

  return bankingRows.map((row: BankingRow) => {
    const profile = profilesById.get(row.tester_id);
    return {
      ...mapBankingDetails(row),
      testerName: profile?.full_name || 'Tester',
      testerEmail: profile?.email || 'Email unavailable',
    };
  });
}

export async function reviewTesterBanking(input: {
  testerId: string;
  status: Exclude<BankingVerificationStatus, 'pending'>;
  note?: string;
}) {
  const { data, error } = await (supabase.rpc as any)('admin_review_tester_banking', {
    p_tester_id: input.testerId,
    p_status: input.status,
    p_note: input.note?.trim() || null,
  });
  if (error) throw error;
  return mapBankingDetails(data as BankingRow);
}
