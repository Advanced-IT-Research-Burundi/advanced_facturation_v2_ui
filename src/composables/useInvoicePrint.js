export function useInvoicePrint() {
  const formatPrice = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openPrint = (html) => {
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  const getInvoiceTypeLabel = (type) => {
    const types = {
      FN: 'Facture Normale',
      FA: 'Facture Avoir',
      FC: 'Facture Caution',
      FP: 'Facture Proforma',
      RC: 'Remboursement Caution',
    };
    return types[type] || 'Facture';
  };

  const getElectronicSignature = (invoice) => {
    return invoice?.obr_electronic_signature || invoice?.electronic_signature || '';
  };

  /**
   * Impression format A4 — mise en page professionnelle
   */
  const printA4 = async (invoice, company = null) => {
    const items = invoice.invoice_items || invoice.items || [];
    const currency = invoice.invoice_currency || 'BIF';
    const electronicSignature = getElectronicSignature(invoice);

    const itemsHtml = items
      .map(
        (item, i) => `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td>${item.item_designation ?? ''}</td>
        <td class="text-center">${item.item_quantity ?? 1}</td>
        <td class="text-right">${formatPrice(item.item_price)}</td>
        <td class="text-center">${item.vat ?? 0}%</td>
        <td class="text-right">${formatPrice((item.item_price ?? 0) * (item.item_quantity ?? 1) * ((item.vat ?? 0) / 100))}</td>
        <td class="text-right">${formatPrice(item.item_total_amount ?? (item.item_price ?? 0) * (item.item_quantity ?? 1))}</td>
      </tr>`,
      )
      .join('');

    const obrHtml =
      invoice.obr_invoice_identifier || invoice.obr_electronic_signature
        ? `<div class="obr-info">
        <p><strong>Informations OBR :</strong></p>
        ${invoice.obr_invoice_identifier ? `<p>Identifiant : ${invoice.obr_invoice_identifier}</p>` : ''}
        ${invoice.obr_invoice_registered_number ? `<p>N° Enregistré : ${invoice.obr_invoice_registered_number}</p>` : ''}
        ${invoice.obr_electronic_signature ? `<p>Signature : ${invoice.obr_electronic_signature}</p>` : ''}
      </div>`
        : '';

    const paymentHtml =
      invoice.total_paid > 0
        ? `<tr><th>Montant payé</th><td class="text-right">${formatPrice(invoice.total_paid)} ${currency}</td></tr>
           <tr><th>Reste à payer</th><td class="text-right">${formatPrice((invoice.invoice_total_amount ?? 0) - (invoice.total_paid ?? 0))} ${currency}</td></tr>`
        : '';

    // QR code — encodage de la signature électronique OBR
    const qrSource = invoice.obr_electronic_signature || invoice.electronic_signature || invoice.obr_invoice_identifier || invoice.invoice_number || '';
    let qrCodeHtml = '';
    try {
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(qrSource, {
        width: 140, margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      qrCodeHtml = `<div style="text-align:center; margin-top:15px;"><img src="${qrDataUrl}" style="width:120px;height:120px;" alt="QR Code" /></div>`;
    } catch (e) {
      console.error('Erreur QR Code A4:', e);
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoice.invoice_number ?? ''}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
    .invoice-container { max-width: 780px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #007bff; padding-bottom: 15px; margin-bottom: 15px; }
    .company-info h1 { font-size: 20px; color: #007bff; margin-bottom: 5px; }
    .company-info p { font-size: 11px; color: #666; margin: 2px 0; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { font-size: 16px; color: #333; }
    .invoice-number { font-size: 14px; font-weight: bold; color: #007bff; }
    .invoice-info p { margin: 2px 0; font-size: 11px; color: #555; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .party { width: 48%; }
    .party h3 { font-size: 12px; background: #f5f5f5; padding: 5px 10px; margin-bottom: 8px; border-left: 3px solid #007bff; }
    .party p { padding-left: 10px; font-size: 11px; margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
    th { background: #007bff; color: white; font-weight: 600; }
    tr:nth-child(even) { background: #f9f9f9; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals { width: 320px; margin-left: auto; margin-bottom: 20px; }
    .totals table { margin-bottom: 0; }
    .totals th { background: #f5f5f5; color: #333; font-weight: 600; }
    .total-row td { background: #007bff !important; color: white; font-weight: bold; }
    .obr-info { margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 10px; }
    .obr-info p { margin: 2px 0; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #666; text-align: center; }
    .footer p { margin: 2px 0; }
    .electronic-signature { word-break: break-all; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <h1>${invoice.tp_name ?? company?.name ?? 'Entreprise'}</h1>
        <p>NIF : ${invoice.tp_TIN ?? company?.tp_TIN ?? 'N/A'}</p>
        <p>RC : ${invoice.tp_trade_number ?? company?.tp_trade_number ?? 'N/A'}</p>
        <p>Tél : ${invoice.tp_phone_number ?? company?.phone ?? 'N/A'}</p>
        <p>Centre Fiscal : ${invoice.tp_fiscal_center ?? 'N/A'}</p>
      </div>
      <div class="invoice-info">
        <h2>${getInvoiceTypeLabel(invoice.invoice_type)}</h2>
        <p class="invoice-number">N° : ${invoice.invoice_number ?? ''}</p>
        <p>Date : ${formatDate(invoice.invoice_date ?? invoice.created_at)}</p>
        <p>Devise : ${currency}</p>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>VENDEUR</h3>
        <p><strong>${invoice.tp_name ?? company?.name ?? 'N/A'}</strong></p>
        <p>NIF : ${invoice.tp_TIN ?? company?.tp_TIN ?? 'N/A'}</p>
        <p>Assujetti TVA : ${invoice.vat_taxpayer === '1' ? 'Oui' : 'Non'}</p>
      </div>
      <div class="party">
        <h3>CLIENT</h3>
        <p><strong>${invoice.customer_name ?? invoice.customer?.customer_name ?? 'Client'}</strong></p>
        <p>NIF : ${invoice.customer_TIN ?? invoice.customer?.customer_TIN ?? 'N/A'}</p>
        <p>Adresse : ${invoice.customer_address ?? invoice.customer?.customer_address ?? 'N/A'}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:40px">#</th>
          <th>Désignation</th>
          <th class="text-center" style="width:55px">Qté</th>
          <th class="text-right" style="width:100px">P.U. HT</th>
          <th class="text-center" style="width:55px">TVA %</th>
          <th class="text-right" style="width:95px">TVA</th>
          <th class="text-right" style="width:110px">Total TTC</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div class="totals">
      <table>
        <tr><th>Total HT</th><td class="text-right">${formatPrice(invoice.invoice_amount_nvat)} ${currency}</td></tr>
        <tr><th>Total TVA</th><td class="text-right">${formatPrice(invoice.invoice_vat_amount)} ${currency}</td></tr>
        <tr class="total-row"><td><strong>TOTAL TTC</strong></td><td class="text-right"><strong>${formatPrice(invoice.invoice_total_amount)} ${currency}</strong></td></tr>
        ${paymentHtml}
      </table>
    </div>

    ${obrHtml}

    <div class="footer">
      <p>Merci pour votre confiance !</p>
      <p>Document généré le ${formatDate(new Date())}</p>
      ${electronicSignature ? `<p class="electronic-signature">Signature électronique : ${electronicSignature}</p>` : ''}
      ${qrCodeHtml}
    </div>
  </div>
</body>
</html>`;

    openPrint(html);
  };

  /**
   * Impression format POS — ticket thermique 80 mm (format OBR officiel)
   */
  const printPOS = async (invoice, company = null) => {
    const items = invoice.invoice_items || invoice.items || [];
    const currency = invoice.invoice_currency || 'BIF';

    // Format date simple: DD/MM/YYYY
    const formatDateSimple = (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td>${item.item_designation ?? ''}</td>
        <td class="center">${item.item_quantity ?? 1}</td>
        <td class="right">${formatPrice(item.item_price)}</td>
        <td class="right">${formatPrice(item.item_total_amount ?? (item.item_price ?? 0) * (item.item_quantity ?? 1))}</td>
      </tr>`,
      )
      .join('');

    const invoiceTypePOS = {
      FN: 'FACTURE NORMALE',
      FA: 'FACTURE AVOIR',
      FC: 'FACTURE CAUTION',
      FP: 'PROFORMA',
      RC: 'REMB. CAUTION',
    }[invoice.invoice_type] ?? 'FACTURE';

    const remainingAmount = (invoice.invoice_total_amount ?? 0) - (invoice.total_paid ?? 0);
    const paidHtml =
      invoice.total_paid > 0
        ? `<tr><td colspan="2"><b>Payé :</b></td><td class="right">${formatPrice(invoice.total_paid)} ${currency}</td></tr>
           <tr><td colspan="2"><b>Reste :</b></td><td class="right">${formatPrice(remainingAmount)} ${currency}</td></tr>`
        : '';

    // QR code — encodage de la signature électronique OBR
    const qrSource = invoice.obr_electronic_signature || invoice.electronic_signature || invoice.obr_invoice_identifier || invoice.invoice_number || '';
    let qrCodeHtml = '';
    try {
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(qrSource, {
        width: 160, margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      const ebmsLabel = invoice.obr_invoice_identifier
        ? `<div style="font-size:8px; word-break:break-all; margin: 4px 0;"><b>EBMS ID</b><br>${invoice.obr_invoice_identifier}</div>`
        : '';
      qrCodeHtml = `
        ${ebmsLabel}
        <div class="center" style="margin-top:6px;">
          <img src="${qrDataUrl}" style="width:120px;height:120px;" alt="QR Code" />
        </div>`;
    } catch (e) {
      if (invoice.obr_invoice_identifier) {
        qrCodeHtml = `<div style="font-size:8px;word-break:break-all; margin: 4px 0;"><b>EBMS ID</b><br>${invoice.obr_invoice_identifier}</div>`;
      }
    }

    // Section A — Vendeur
    const sectionA = `
    <div class="section-title">A. IDENTIFICATION DU VENDEUR</div>
    <table class="info-table">
      <tr>
        <td><b>Raison sociale</b></td>
        <td>${invoice.tp_name ?? company?.name ?? 'EDEN MART'}</td>
        <td><b>Centre fiscal</b></td>
        <td>${invoice.tp_fiscal_center ?? 'DMC'}</td>
      </tr>
      <tr>
        <td><b>NIF</b></td>
        <td>${invoice.tp_TIN ?? company?.tp_TIN ?? 'N/A'}</td>
        <td><b>Téléphone</b></td>
        <td>${invoice.tp_phone_number ?? company?.phone ?? 'N/A'}</td>
      </tr>
      <tr>
        <td><b>R.C.</b></td>
        <td>${invoice.tp_trade_number ?? company?.tp_trade_number ?? 'N/A'}</td>
        <td><b>Forme juridique</b></td>
        <td>${invoice.tp_legal_form ?? company?.legal_form ?? 'SURL'}</td>
      </tr>
      <tr>
        <td><b>Secteur d'activités</b></td>
        <td>${invoice.tp_activity_sector ?? company?.activity_sector ?? 'Commercial'}</td>
        <td><b>Assujetti à la TVA</b></td>
        <td>${invoice.vat_taxpayer === '1' ? 'OUI' : 'NON'}</td>
      </tr>
      <tr>
        <td><b>Assujetti à la TC</b></td>
        <td>${invoice.ct_taxpayer === '1' ? 'OUI' : 'NON'}</td>
        <td><b>Assujetti à la PF</b></td>
        <td>${invoice.tp_taxpayer === '1' ? 'OUI' : 'NON'}</td>
      </tr>
      <tr>
        <td colspan="2"><b>Adresse du vendeur</b></td>
        <td colspan="2">${invoice.tp_address ?? company?.address ?? 'Bujumbura mairie, Rohero 1 Avenue de Croix Rouge N°2'}</td>
      </tr>
    </table>`;

    // Section B — Client
    const sectionB = `
    <div class="section-title">B. IDENTIFICATION DU CLIENT<br><span style="font-size:8px;font-weight:normal;">PERSONNE PHYSIQUE</span></div>
    <table class="info-table">
      <tr>
        <td colspan="2"><b>Nom et Prénom/Raison sociale</b></td>
        <td colspan="2">${invoice.customer_name ?? invoice.customer?.customer_name ?? 'N/A'}</td>
      </tr>
      <tr>
        <td colspan="2"><b>NIF</b></td>
        <td colspan="2">${invoice.customer_TIN ?? invoice.customer?.customer_TIN ?? 'N/A'}</td>
      </tr>
      <tr>
        <td colspan="2"><b>Assujetti à la TVA</b></td>
        <td colspan="2">${invoice.customer_vat_taxpayer === '1' ? 'OUI' : 'NON'}</td>
      </tr>
      <tr>
        <td colspan="2"><b>Adresse du Client</b></td>
        <td colspan="2">${invoice.customer_address ?? invoice.customer?.customer_address ?? 'N/A'}</td>
      </tr>
    </table>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>POS - ${invoice.invoice_number ?? ''}</title>
  <style>
    @page { size: 80mm auto; margin: 3mm 2mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 9px;
      line-height: 1.4;
      color: #000;
      width: 76mm;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .spacer { height: 6px; }
    .company-name { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
    .invoice-number-line { font-size: 11px; font-weight: bold; margin: 2px 0; }
    .section-title { font-size: 9px; font-weight: bold; margin: 6px 0 2px 0; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
    .info-table td { font-size: 8px; padding: 1px 1px; vertical-align: top; }
    table.items-table { width: 100%; border-collapse: collapse; margin-top: 4px; border: 1px solid #000; }
    table.items-table td, table.items-table th { font-size: 9px; padding: 2px 3px; vertical-align: middle; border: 1px solid #000; }
    td.center { text-align: center; }
    td.right { text-align: right; }
    .totals-block { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .totals-block td { font-size: 9px; padding: 1px 0; }
  </style>
</head>
<body>
  <!-- En-tête entreprise -->
  <div class="center">
    <div class="company-name">EDEN MART</div>
  </div>

  <div class="spacer"></div>

  <!-- Numéro de facture -->
  <div class="center">
    <div class="invoice-number-line">${invoiceTypePOS} N° ${invoice.invoice_number ?? ''}</div>
    <div>Date ${formatDateSimple(invoice.invoice_date ?? invoice.created_at)}</div>
  </div>

  <div class="spacer"></div>

  <!-- Section A : Vendeur -->
  ${sectionA}

  <div class="spacer"></div>

  <!-- Section B : Client -->
  ${sectionB}

  <div class="spacer"></div>

  <!-- Tableau des articles -->
  <table class="items-table">
    <thead>
      <tr>
        <td class="bold">Désignation</td>
        <td class="bold center">Qté</td>
        <td class="bold right">Prix U.</td>
        <td class="bold right">Total</td>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="spacer"></div>

  <!-- Totaux -->
  <table class="totals-block">
    <tr>
      <td colspan="2" style="text-align:right"><b>TOTAL HTVA : ${formatPrice(invoice.invoice_amount_nvat)} ${currency}</b></td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:right"><b>TOTAL TVA : ${formatPrice(invoice.invoice_vat_amount)} ${currency}</b></td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:right"><b>TOTAL TVAC : ${formatPrice(invoice.invoice_total_amount)} ${currency}</b></td>
    </tr>
    ${paidHtml}
  </table>

  <!-- EBMS ID + QR Code -->
  ${qrCodeHtml}

  <div class="spacer"></div>
  <div class="center" style="font-size:8px; margin-top:4px;">
    <div>Merci pour votre confiance !</div>
    <div>Document généré le ${formatDate(new Date())}</div>
  </div>
</body>
</html>`;

    openPrint(html);
  };

  /**
   * Convertit une commande restaurant-bar en objet invoice compatible
   * avec printA4 / printPOS.
   */
  const buildBarOrderInvoice = (order, company = null) => ({
    invoice_number: `CMD-${order.id ?? ''}`,
    invoice_type: 'FN',
    invoice_date: order.created_at ?? new Date().toISOString(),
    invoice_currency: company?.default_currency ?? 'BIF',
    customer_name: order.client_name || `Table ${order.table_number}`,
    customer_TIN: null,
    customer_address: null,
    tp_name: company?.name ?? null,
    tp_TIN: company?.tp_TIN ?? null,
    tp_phone_number: company?.tp_phone_number ?? null,
    tp_trade_number: company?.tp_trade_number ?? null,
    tp_fiscal_center: company?.tp_fiscal_center ?? null,
    vat_taxpayer: '0',
    items: (order.items ?? []).map((item) => ({
      item_designation: item.name ?? '',
      item_quantity: item.qty ?? 1,
      item_price: item.price ?? 0,
      vat: 0,
      item_total_amount: (item.price ?? 0) * (item.qty ?? 1),
    })),
    invoice_total_amount: order.total ?? 0,
    invoice_amount_nvat: order.total ?? 0,
    invoice_vat_amount: 0,
    total_paid: order.status === 'paid' ? (order.total ?? 0) : 0,
  });

  /**
   * Ticket cuisine A4 — bon de commande interne pour la cuisine.
   */
  const printKitchenTicketA4 = (order, company = null) => {
    const location = order.location_label
      || (order.room_number ? `Chambre N°${order.room_number}` : (order.table_number ? `Table N°${order.table_number}` : '—'));

    const itemsHtml = (order.items ?? [])
      .map(
        (item, i) => `<tr>
          <td class="text-center">${i + 1}</td>
          <td>${item.name ?? ''}</td>
          <td class="text-center">${item.qty ?? 1}</td>
        </tr>`,
      )
      .join('');

    const now = formatDate(new Date());

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bon de Cuisine — ${location}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
    .invoice-container { max-width: 780px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #007bff; padding-bottom: 15px; margin-bottom: 15px; }
    .company-info h1 { font-size: 20px; color: #007bff; margin-bottom: 5px; }
    .company-info p { font-size: 11px; color: #666; margin: 2px 0; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { font-size: 16px; color: #333; }
    .invoice-number { font-size: 14px; font-weight: bold; color: #007bff; }
    .invoice-info p { margin: 2px 0; font-size: 11px; color: #555; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .party { width: 48%; }
    .party h3 { font-size: 12px; background: #f5f5f5; padding: 5px 10px; margin-bottom: 8px; border-left: 3px solid #007bff; }
    .party p { padding-left: 10px; font-size: 11px; margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
    th { background: #007bff; color: white; font-weight: 600; }
    tr:nth-child(even) { background: #f9f9f9; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .note-box { margin-bottom: 15px; padding: 10px; background: #fffde7; border: 1px solid #f9a825; border-radius: 4px; font-size: 11px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #666; text-align: center; }
    .footer p { margin: 2px 0; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <h1>${company?.name ?? 'Établissement'}</h1>
        <p>NIF : ${company?.tp_TIN ?? company?.nif ?? ''}</p>
        <p>RC : ${company?.tp_trade_number ?? ''}</p>
        <p>Tél : ${company?.phone ?? ''}</p>
        <p>Centre Fiscal : ${company?.tp_fiscal_center ?? ''}</p>
      </div>
      <div class="invoice-info">
        <h2>Bon de Cuisine</h2>
        <p class="invoice-number">N° : ${order.id ?? '—'}</p>
        <p>Date : ${formatDate(order.created_at ?? new Date())}</p>
        <p>Devise : BIF</p>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>EMPLACEMENT</h3>
        <p><strong>${location}</strong></p>
        ${order.is_room_service ? '<p>⚑ Service Chambre</p>' : ''}
      </div>
      <div class="party">
        <h3>STATUT</h3>
        <p><strong>${order.status ?? '—'}</strong></p>
        <p>Imprimé le : ${now}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:40px">#</th>
          <th>Article / Plat</th>
          <th class="text-center" style="width:80px">Quantité</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    ${order.notes ? `<div class="note-box"><strong>Note :</strong> ${order.notes}</div>` : ''}

    <div class="footer">
      <p>Document généré le ${now} — Usage interne cuisine</p>
    </div>
  </div>
</body>
</html>`;
    openPrint(html);
  };

  /**
   * Ticket cuisine POS — bon thermique 80 mm pour la cuisine.
   */
  const printKitchenTicketPOS = (order, company = null) => {
    const location = order.location_label
      || (order.room_number ? `Chambre N°${order.room_number}` : (order.table_number ? `Table N°${order.table_number}` : '—'));

    const itemsHtml = (order.items ?? [])
      .map(
        (item) => `<tr>
          <td>${item.name ?? ''}</td>
          <td class="right bold">×${item.qty ?? 1}</td>
        </tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bon Cuisine — ${location}</title>
  <style>
    @page { size: 80mm auto; margin: 3mm 2mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.6; color: #000; width: 76mm; }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .sep { border-top: 1px dashed #000; margin: 5px 0; }
    .title { font-size: 15px; font-weight: bold; letter-spacing: 1px; }
    table { width: 100%; border-collapse: collapse; }
    td { font-size: 11px; padding: 2px 0; }
    .highlight { background: #000; color: #fff; padding: 2px 4px; }
  </style>
</head>
<body>
  <div class="center">
    ${company?.name ? `<div class="bold" style="font-size:13px">${company.name}</div>` : ''}
    <div class="sep"></div>
    <div class="title">BON DE CUISINE</div>
    <div style="font-size:10px">N° ${order.id ?? '—'}</div>
  </div>
  <div class="sep"></div>
  <div><span class="bold">Lieu : </span><span class="bold">${location}</span></div>
  ${order.is_room_service ? '<div style="font-size:10px">⚑ SERVICE CHAMBRE</div>' : ''}
  <div><span class="bold">Heure : </span>${formatDate(order.created_at ?? new Date())}</div>
  <div class="sep"></div>
  <table>
    <tbody>${itemsHtml}</tbody>
  </table>
  ${order.notes ? `<div class="sep"></div><div><span class="bold">Note : </span>${order.notes}</div>` : ''}
  <div class="sep"></div>
  <div class="center" style="font-size:9px">Imprimé le ${formatDate(new Date())}</div>
  <div class="center" style="font-size:9px">Usage interne — Cuisine</div>
</body>
</html>`;
    openPrint(html);
  };

  return { printA4, printPOS, buildBarOrderInvoice, printKitchenTicketA4, printKitchenTicketPOS };
}
