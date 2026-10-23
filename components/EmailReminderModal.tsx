'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Clock,
  User,
  Loader2,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Invoice, Client, SystemSettings, isInvoiceOverdue, getDaysOverdue } from '@/types/water-system';

interface EmailReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  client?: Client | null;
  settings: SystemSettings;
  onReminderSent?: (invoiceId: string, email: string) => Promise<void>;
  onUpdateClientEmail?: (clientId: string, email: string) => Promise<void>;
}

export function EmailReminderModal({
  isOpen,
  onClose,
  invoice,
  client,
  settings,
  onReminderSent,
  onUpdateClientEmail,
}: EmailReminderModalProps) {
  if (!isOpen || !invoice) return null;

  return (
    <EmailReminderModalForm
      key={invoice.id}
      onClose={onClose}
      invoice={invoice}
      client={client}
      settings={settings}
      onReminderSent={onReminderSent}
      onUpdateClientEmail={onUpdateClientEmail}
    />
  );
}

function EmailReminderModalForm({
  onClose,
  invoice,
  client,
  settings,
  onReminderSent,
  onUpdateClientEmail,
}: {
  onClose: () => void;
  invoice: Invoice;
  client?: Client | null;
  settings: SystemSettings;
  onReminderSent?: (invoiceId: string, email: string) => Promise<void>;
  onUpdateClientEmail?: (clientId: string, email: string) => Promise<void>;
}) {
  const isOverdue = isInvoiceOverdue(invoice);
  const daysOverdue = getDaysOverdue(invoice.dueDate);

  // Recipient email initialization
  const initialEmail = invoice.clientEmail || client?.email || '';

  const [recipientEmail, setRecipientEmail] = useState(initialEmail);
  const [saveToClient, setSaveToClient] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Default subject line
  const defaultSubject = isOverdue
    ? `[${settings.companyName || 'Águas da Manhiça'}] Aviso de Cobrança: Fatura nº ${invoice.invoiceNumber} em atraso`
    : `[${settings.companyName || 'Águas da Manhiça'}] Lembrete de Pagamento: Fatura nº ${invoice.invoiceNumber}`;

  const [subject, setSubject] = useState(defaultSubject);

  // Generate official reminder message body
  const generateDefaultBody = () => {
    const formattedTotal = invoice.totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 });
    const formattedUnit = invoice.unitPriceM3.toFixed(2);
    const dueDateFormatted = invoice.dueDate || 'Data estipulada';

    let overdueNotice = '';
    if (isOverdue) {
      overdueNotice = `\n⚠️ ATENÇÃO: Esta fatura atingiu o prazo de vencimento no dia ${dueDateFormatted} (${daysOverdue} dias em atraso). Solicitamos a rápida regularização do valor para evitar a suspensão do fornecimento de água no seu ramal.\n`;
    } else {
      overdueNotice = `\nLembramos que a data limite para liquidação desta fatura é até ${dueDateFormatted}.\n`;
    }

    return `Exmo.(a) Sr.(a) ${invoice.clientName},

Esperamos que esta mensagem o(a) encontre bem.

Vimos por este meio apresentar o lembrete de pagamento da fatura de consumo de água emitida pela empresa ${settings.companyName || 'Águas da Manhiça'}.

--------------------------------------------------
RESUMO DA FATURA
--------------------------------------------------
• Nº da Fatura: ${invoice.invoiceNumber}
• Mês de Referência: ${invoice.periodMonth}
• Hidrómetro / Contador: ${invoice.meterNumber}
• Leitura Anterior: ${invoice.previousReading} m³
• Leitura Atual: ${invoice.currentReading} m³
• Volume Faturado: ${invoice.consumptionM3} m³
• Preço Unitário: ${formattedUnit} ${settings.currency}/m³
• Taxa de Conservação/Contador: ${invoice.fixedFee} ${settings.currency}
• VALOR TOTAL A PAGAR: ${formattedTotal} ${settings.currency}
• Data Limite de Vencimento: ${dueDateFormatted}
--------------------------------------------------
${overdueNotice}
INSTRUÇÕES DE PAGAMENTO:
1. M-Pesa / E-Mola:
   - Pagamento de Serviços: Águas da Manhiça
   - Referência / Hidrómetro: ${invoice.meterNumber}
   - Contacto da Linha de Apoio: ${settings.companyPhone || '+258 84 000 0000'}

2. Balcão / Guiché Presencial:
   - Atendimento na Administração / Posto Central de Abastecimento (${settings.communityName || 'Manhiça Sede'})

Nota: Se já efetuou a liquidação desta fatura nas últimas 24 horas, solicitamos a gentileza de desconsiderar este aviso ou de nos enviar o comprovativo via WhatsApp/SMS para o contacto ${settings.companyPhone || '+258 84 000 0000'}.

Com os melhores cumprimentos,
${settings.companyName || 'Águas da Manhiça'}
Gestão de Abastecimento de Água - Bairros de Manhiça
Email: ${settings.companyEmail || 'contacto@aguasmanhica.co.mz'}

--------------------------------------------------
processado por computador`;
  };

  const [messageBody, setMessageBody] = useState(generateDefaultBody);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMessage('Por favor insira um endereço de email válido.');
      return;
    }

    setSending(true);
    setErrorMessage(null);
    setSentSuccess(null);

    try {
      const response = await fetch('/api/email/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail.trim(),
          subject: subject.trim(),
          message: messageBody,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao comunicar com o servidor de envio.');
      }

      if (onReminderSent) {
        await onReminderSent(invoice.id, recipientEmail.trim());
      }

      if (saveToClient && client && onUpdateClientEmail && recipientEmail.trim() !== client.email) {
        await onUpdateClientEmail(client.id, recipientEmail.trim()).catch((err) => {
          console.warn('Could not auto-save email to client document:', err);
        });
      }

      setSentSuccess(`Lembrete enviado com sucesso para ${recipientEmail.trim()}! O registo foi atualizado na base de dados.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao enviar lembrete.');
    } finally {
      setSending(false);
    }
  };

  const handleOpenMailto = () => {
    if (!recipientEmail) {
      setErrorMessage('Por favor insira um endereço de email do cliente.');
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail.trim())}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(messageBody)}`;

    const a = document.createElement('a');
    a.href = mailtoUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (onReminderSent) {
      onReminderSent(invoice.id, recipientEmail.trim()).catch((err) =>
        console.warn('Error recording mailto reminder in db:', err)
      );
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageBody);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 3000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-sky-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-linear-to-r from-sky-50 via-slate-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                isOverdue ? 'bg-rose-600' : 'bg-sky-600'
              }`}
            >
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Enviar Lembrete de Cobrança</h3>
                {isOverdue ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>EM ATRASO ({daysOverdue}d)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>PENDENTE</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Notificação por email para o cliente com detalhes de consumo e formas de pagamento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Ribbon */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-800">{invoice.clientName}</span>
            <span className="text-slate-400 font-mono text-[11px]">({invoice.meterNumber})</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Vencimento: <strong className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}>{invoice.dueDate || 'N/D'}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Total: <strong className="text-slate-900 font-black">{invoice.totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} {settings.currency}</strong></span>
            </span>
          </div>
        </div>

        {/* Alerts / Feedback */}
        {errorMessage && (
          <div className="m-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {sentSuccess && (
          <div className="m-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sentSuccess}</span>
          </div>
        )}

        {/* Existing reminder history info */}
        {invoice.reminderSentAt && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Último lembrete enviado em:{' '}
                <strong>{new Date(invoice.reminderSentAt).toLocaleString('pt-MZ')}</strong>
                {invoice.clientEmail && ` para ${invoice.clientEmail}`}
              </span>
            </div>
            {invoice.reminderCount && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200 text-blue-900">
                {invoice.reminderCount}x enviado{invoice.reminderCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSendEmail} className="p-5 space-y-4 flex-1">
          {/* Recipient Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email do Cliente (Destinatário) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="ex: armando.sitoe@gmail.com"
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              />
            </div>
            {client && !client.email && (
              <label className="flex items-center gap-2 text-[11px] text-slate-600 mt-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToClient}
                  onChange={(e) => setSaveToClient(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Guardar este endereço de email no perfil do cliente ({client.name})</span>
              </label>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assunto da Mensagem
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white font-medium text-slate-800"
            />
          </div>

          {/* Message Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Conteúdo do Email de Notificação
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedFeedback ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
            <textarea
              rows={9}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full text-xs p-3 font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/60 leading-relaxed text-slate-800"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleOpenMailto}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
              title="Abrir no programa de email pré-instalado (Gmail, Outlook, etc.) com todos os campos preenchidos"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Abrir no Cliente de Email (mailto)</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>A enviar lembrete...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Notificação & Registar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest pt-1">
            processado por computador
          </div>
        </form>
      </div>
    </div>
  );
}
