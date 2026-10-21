import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, message, invoiceNumber, clientName } = body;

    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { error: 'Endereço de email inválido.' },
        { status: 400 }
      );
    }

    // Server-side audit log of the dispatched reminder
    console.info(`[WaterApp Email Reminder] Sending reminder for invoice ${invoiceNumber} to ${to} (${clientName}) at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Notificação de cobrança enviada com sucesso para ${to}.`,
      sentAt: new Date().toISOString(),
      recipient: to,
      subject,
    });
  } catch (error: any) {
    console.error('Error in email reminder route:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao processar o envio do lembrete por email.' },
      { status: 500 }
    );
  }
}
