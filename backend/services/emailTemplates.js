const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
    if (!value) return '';
    try {
        return new Date(value).toLocaleDateString('hu-HU');
    } catch (err) {
        return String(value);
    }
};

const formatPrice = (value) => {
    const num = Number(value || 0);
    return `${num.toLocaleString('hu-HU')} Ft`;
};

const formatMultiline = (value) => {
    const safe = escapeHtml(value || '');
    return safe.replace(/\r?\n/g, '<br>');
};

const buildRegistrationEmail = ({ name }) => {
    const safeName = escapeHtml(name || '');
    const subject = 'Sikeres regisztráció a Túrázz Velünk oldalra';
    const text = `Szia ${safeName}!\n\nKöszönjük a regisztrációt. Várunk szeretettel a Túrázz Velünk oldalon!\n`;
    const html = `
        <div style="background: #f4f7fb; padding: 32px 16px; font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; color: #1f2933;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                    <td style="background: #0f172a; padding: 24px 28px; border-radius: 16px 16px 0 0;">
                        <div style="color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 0.4px;">Túrázz Velünk</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Kaland. Természet. Közös élmények.</div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Szia ${safeName}!</h2>
                        <p style="margin: 0 0 16px; color: #334155;">Köszönjük a regisztrációt. Várunk szeretettel a Túrázz Velünk oldalon!</p>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px;">
                            <div style="font-size: 14px; color: #475569;">Indulhat a tervezés?</div>
                            <div style="font-size: 13px; color: #64748b; margin-top: 6px;">Nézz körül a friss túrák között, és foglalj időben!</div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 0 28px 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <p style="margin: 20px 0 0; font-size: 14px; color: #475569;">Üdvözlettel,<br><strong>Túrázz Velünk</strong></p>
                    </td>
                </tr>
                <tr>
                    <td style="background: #e2e8f0; padding: 16px 28px; border-radius: 0 0 16px 16px; font-size: 12px; color: #64748b;">
                        Ha nem te regisztráltál, ezt az emailt nyugodtan figyelmen kívül hagyhatod.
                    </td>
                </tr>
            </table>
        </div>
    `;

    return { subject, text, html };
};

const buildBookingEmail = ({ name, tourTitle, startDate, endDate, totalPrice }) => {
    const safeName = escapeHtml(name || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const subject = `Foglalás visszaigazolás: ${safeTitle}`;
    const text = `Szia ${safeName}!\n\nA foglalásod rögzítve lett.\nTúra: ${safeTitle}\nIdőpont: ${formatDate(startDate)} - ${formatDate(endDate)}\nVégösszeg: ${formatPrice(totalPrice)}\n`;
    const html = `
        <div style="background: #f4f7fb; padding: 32px 16px; font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; color: #1f2933;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                    <td style="background: #0f172a; padding: 24px 28px; border-radius: 16px 16px 0 0;">
                        <div style="color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 0.4px;">Túrázz Velünk</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Foglalás visszaigazolás</div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Szia ${safeName}!</h2>
                        <p style="margin: 0 0 16px; color: #334155;">A foglalásod rögzítve lett. Itt vannak a részletek:</p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Túra</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 600;">${safeTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Időpont</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">${formatDate(startDate)} - ${formatDate(endDate)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Végösszeg</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 600;">${formatPrice(totalPrice)}</td>
                            </tr>
                        </table>
                        <div style="margin-top: 18px; background: #ecfeff; border: 1px solid #a5f3fc; color: #155e75; padding: 12px 16px; border-radius: 10px; font-size: 13px;">
                            Ha bármi kérdésed van, válaszolj erre az emailre, és segítünk.
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 0 28px 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <p style="margin: 20px 0 0; font-size: 14px; color: #475569;">Üdvözlettel,<br><strong>Túrázz Velünk</strong></p>
                    </td>
                </tr>
                <tr>
                    <td style="background: #e2e8f0; padding: 16px 28px; border-radius: 0 0 16px 16px; font-size: 12px; color: #64748b;">
                        Foglalási státuszodat a profilodban követheted.
                    </td>
                </tr>
            </table>
        </div>
    `;

    return { subject, text, html };
};

const buildBookingCancelledEmail = ({ name, tourTitle }) => {
    const safeName = escapeHtml(name || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const subject = `Lejelentkezés visszaigazolás: ${safeTitle}`;
    const text = `Szia ${safeName}!\n\nA lejelentkezésed rögzítve lett.\nTúra: ${safeTitle}\n`;
    const html = `
        <div style="background: #f4f7fb; padding: 32px 16px; font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; color: #1f2933;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                    <td style="background: #0f172a; padding: 24px 28px; border-radius: 16px 16px 0 0;">
                        <div style="color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 0.4px;">Túrázz Velünk</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Lejelentkezés visszaigazolás</div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Szia ${safeName}!</h2>
                        <p style="margin: 0 0 16px; color: #334155;">A lejelentkezésed rögzítve lett.</p>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px;">
                            <div style="font-size: 13px; color: #64748b;">Túra</div>
                            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${safeTitle}</div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #e2e8f0; padding: 16px 28px; border-radius: 0 0 16px 16px; font-size: 12px; color: #64748b;">
                        Ha tévedésből mondtad le, írj nekünk bátran.
                    </td>
                </tr>
            </table>
        </div>
    `;

    return { subject, text, html };
};

const buildPaymentEmail = ({ name, tourTitle, amount }) => {
    const safeName = escapeHtml(name || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const subject = `Sikeres befizetés: ${safeTitle}`;
    const text = `Szia ${safeName}!\n\nA befizetésed sikeres volt.\nTúra: ${safeTitle}\nÖsszeg: ${formatPrice(amount)}\n`;
    const html = `
        <div style="background: #f4f7fb; padding: 32px 16px; font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; color: #1f2933;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                    <td style="background: #0f172a; padding: 24px 28px; border-radius: 16px 16px 0 0;">
                        <div style="color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 0.4px;">Túrázz Velünk</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Befizetés visszaigazolás</div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Szia ${safeName}!</h2>
                        <p style="margin: 0 0 16px; color: #334155;">A befizetésed sikeres volt.</p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Túra</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 600;">${safeTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Összeg</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 600;">${formatPrice(amount)}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="background: #e2e8f0; padding: 16px 28px; border-radius: 0 0 16px 16px; font-size: 12px; color: #64748b;">
                        Köszönjük, hogy velünk túrázol!
                    </td>
                </tr>
            </table>
        </div>
    `;

    return { subject, text, html };
};

const buildAdminEmail = ({ subject, message }) => {
    const safeSubject = escapeHtml(subject || 'Üzenet');
    const safeMessage = formatMultiline(message);
    const text = `${subject}\n\n${message}`;
    const html = `
        <div style="background: #f4f7fb; padding: 32px 16px; font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; color: #1f2933;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                    <td style="background: #0f172a; padding: 24px 28px; border-radius: 16px 16px 0 0;">
                        <div style="color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 0.4px;">Túrázz Velünk</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Közlemény</div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">${safeSubject}</h2>
                        <div style="font-size: 14px; color: #334155; line-height: 1.6;">${safeMessage}</div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #e2e8f0; padding: 16px 28px; border-radius: 0 0 16px 16px; font-size: 12px; color: #64748b;">
                        Ez az üzenet a Túrázz Velünk adminisztrációjától érkezett.
                    </td>
                </tr>
            </table>
        </div>
    `;

    return { subject, text, html };
};

module.exports = { buildRegistrationEmail, buildBookingEmail, buildBookingCancelledEmail, buildPaymentEmail, buildAdminEmail };
