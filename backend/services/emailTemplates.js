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

const formatDateRange = (startDate, endDate) => {
    const startText = formatDate(startDate);
    const endText = formatDate(endDate);
    if (startText && endText) return `${startText} - ${endText}`;
    return startText || endText || '';
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

const buildAccountDeletedEmail = ({ name }) => {
    const safeName = escapeHtml(name || '');
    const subject = 'Fiók törlése a Túrázz Velünk oldalról';
    const text = `Szia ${safeName}!\n\nA fiókodat töröltük a Túrázz Velünk oldalon.\nA törlés végleges, a fiók nem állítható vissza.\n`;
    const html = `
        <div style="background: #f4f7fb; padding: 32px 16px; font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; color: #1f2933;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                    <td style="background: #0f172a; padding: 24px 28px; border-radius: 16px 16px 0 0;">
                        <div style="color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 0.4px;">Túrázz Velünk</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Fiók törlése</div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Szia ${safeName}!</h2>
                        <p style="margin: 0 0 16px; color: #334155;">A fiókodat töröltük a Túrázz Velünk oldalon.</p>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px;">
                            <div style="font-size: 13px; color: #64748b;">A törlés végleges, a fiók nem állítható vissza.</div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #e2e8f0; padding: 16px 28px; border-radius: 0 0 16px 16px; font-size: 12px; color: #64748b;">
                        Köszönjük, hogy velünk túráztál.
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
    const text = `Szia ${safeName}!\n\nA foglalásod rögzítve lett.\nTúra: ${safeTitle}\nIdőpont: ${formatDate(startDate)} - ${formatDate(endDate)}\n`;
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

const buildBookingCancelledEmail = ({ name, tourTitle, startDate, endDate }) => {
    const safeName = escapeHtml(name || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const dateRange = formatDateRange(startDate, endDate) || '-';
    const subject = `Lejelentkezés visszaigazolás: ${safeTitle}`;
    const text = `Szia ${safeName}!\n\nA jelentkezésed törölve lett.\nTúra: ${safeTitle}\nIdőpont: ${dateRange}\n`;
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
                        <p style="margin: 0 0 16px; color: #334155;">A jelentkezésed törölve lett</p>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px;">
                            <div style="font-size: 13px; color: #64748b;">Túra</div>
                            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${safeTitle}</div>
                            <div style="font-size: 13px; color: #64748b; margin-top: 8px;">Időpont</div>
                            <div style="font-size: 14px; color: #0f172a;">${dateRange}</div>
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

const buildAdminRemovedBookingEmail = ({ name, tourTitle, adminName, startDate, endDate }) => {
    const safeName = escapeHtml(name || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const safeAdmin = escapeHtml(adminName || 'Admin');
    const dateRange = formatDateRange(startDate, endDate) || '-';
    const subject = `Jelentkezésed törölve lett: ${safeTitle}`;
    const text = `Szia ${safeName}!\n\n${safeAdmin} törölte a jelentkezésedet.\nTúra: ${safeTitle}\nIdőpont: ${dateRange}\n`;
    const html = `
        <div style="background: #f4f7fb; padding: 32px 16px; font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; color: #1f2933;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                    <td style="background: #0f172a; padding: 24px 28px; border-radius: 16px 16px 0 0;">
                        <div style="color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 0.4px;">Túrázz Velünk</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Jelentkezés törölve</div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Szia ${safeName}!</h2>
                        <p style="margin: 0 0 16px; color: #334155;">${safeAdmin} törölte a jelentkezésedet.</p>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px;">
                            <div style="font-size: 13px; color: #64748b;">Túra</div>
                            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${safeTitle}</div>
                            <div style="font-size: 13px; color: #64748b; margin-top: 8px;">Időpont</div>
                            <div style="font-size: 14px; color: #0f172a;">${dateRange}</div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #e2e8f0; padding: 16px 28px; border-radius: 0 0 16px 16px; font-size: 12px; color: #64748b;">
                        Ha kérdésed van, válaszolj erre az emailre.
                    </td>
                </tr>
            </table>
        </div>
    `;

    return { subject, text, html };
};

const buildAdminRemovedBookingNotificationEmail = ({ adminName, userName, userEmail, tourTitle, startDate, endDate }) => {
    const safeAdmin = escapeHtml(adminName || 'Admin');
    const safeUser = escapeHtml(userName || '');
    const safeEmail = escapeHtml(userEmail || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const dateRange = formatDateRange(startDate, endDate) || '-';
    const subject = `Admin törlés: ${safeTitle}`;
    const text = `Admin törlés történt.\nAdmin: ${adminName || '-'}\nFelhasználó: ${userName || '-'} (${userEmail || 'n/a'})\nTúra: ${safeTitle}\nIdőpont: ${dateRange}`;
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
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Admin törlés: ${safeTitle}</h2>
                        <p style="margin: 0 0 16px; color: #334155;">${safeAdmin} törölte ${safeUser}${safeEmail ? ` (${safeEmail})` : ''} jelentkezését.</p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Túra</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 600;">${safeTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Időpont</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">${dateRange}</td>
                            </tr>
                        </table>
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

const buildCancellationRequestEmail = ({ name, tourTitle, reason, startDate, endDate }) => {
    const safeName = escapeHtml(name || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const safeReason = formatMultiline(reason || '');
    const dateRange = formatDateRange(startDate, endDate) || '-';
    const subject = `Lejelentkezési kérelem rögzítve: ${safeTitle}`;
    const text = `Szia ${safeName}!\n\nA lejelentkezési kérelmedet rögzítettük.\nTúra: ${safeTitle}\nIdőpont: ${dateRange}\nIndok: ${reason || '-'}\n\nHamarosan visszajelzünk.`;
    const html = `
        <div style="background: #f4f7fb; padding: 32px 16px; font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; color: #1f2933;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                    <td style="background: #0f172a; padding: 24px 28px; border-radius: 16px 16px 0 0;">
                        <div style="color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 0.4px;">Túrázz Velünk</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Lejelentkezési kérelem</div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Szia ${safeName}!</h2>
                        <p style="margin: 0 0 16px; color: #334155;">A lejelentkezési kérelmedet rögzítettük.</p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Túra</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 600;">${safeTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Időpont</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">${dateRange}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Indok</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">${safeReason || '-'}</td>
                            </tr>
                        </table>
                        <div style="margin-top: 18px; background: #ecfeff; border: 1px solid #a5f3fc; color: #155e75; padding: 12px 16px; border-radius: 10px; font-size: 13px;">
                            Hamarosan visszajelzünk a kérelmedről.
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #e2e8f0; padding: 16px 28px; border-radius: 0 0 16px 16px; font-size: 12px; color: #64748b;">
                        Köszönjük, hogy velünk túrázol.
                    </td>
                </tr>
            </table>
        </div>
    `;

    return { subject, text, html };
};

const buildCancellationRejectedEmail = ({ name, tourTitle, startDate, endDate }) => {
    const safeName = escapeHtml(name || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const dateRange = formatDateRange(startDate, endDate) || '-';
    const subject = `Lejelentkezési kérelem elutasítva: ${safeTitle}`;
    const text = `Szia ${safeName}!\n\nA lejelentkezési kérelmedet elutasítottuk.\nTúra: ${safeTitle}\nIdőpont: ${dateRange}\n\nHa kérdésed van, válaszolj erre az emailre.`;
    const html = `
        <div style="background: #f4f7fb; padding: 32px 16px; font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; color: #1f2933;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                    <td style="background: #0f172a; padding: 24px 28px; border-radius: 16px 16px 0 0;">
                        <div style="color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 0.4px;">Túrázz Velünk</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Lejelentkezési kérelem</div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Szia ${safeName}!</h2>
                        <p style="margin: 0 0 16px; color: #334155;">A lejelentkezési kérelmedet elutasítottuk.</p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Túra</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 600;">${safeTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Időpont</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">${dateRange}</td>
                            </tr>
                        </table>
                        <div style="margin-top: 18px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px 16px; border-radius: 10px; font-size: 13px;">
                            Ha kérdésed van, válaszolj erre az emailre.
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #e2e8f0; padding: 16px 28px; border-radius: 0 0 16px 16px; font-size: 12px; color: #64748b;">
                        Köszönjük, hogy velünk túrázol.
                    </td>
                </tr>
            </table>
        </div>
    `;

    return { subject, text, html };
};

const buildAdminCancellationRequestEmail = ({ userName, userEmail, tourTitle, reason, startDate, endDate }) => {
    const safeName = escapeHtml(userName || '');
    const safeEmail = escapeHtml(userEmail || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const safeReason = formatMultiline(reason || '');
    const dateRange = formatDateRange(startDate, endDate) || '-';
    const subject = `Lejelentkezési kérelem érkezett: ${safeTitle}`;
    const text = `Lejelentkezési kérelem érkezett.\nFelhasználó: ${userName || '-'} (${userEmail || 'n/a'})\nTúra: ${safeTitle}\nIdőpont: ${dateRange}\nIndok: ${reason || '-'}`;
    const html = `
        <div style="background: #f4f7fb; padding: 32px 16px; font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif; color: #1f2933;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                    <td style="background: #0f172a; padding: 24px 28px; border-radius: 16px 16px 0 0;">
                        <div style="color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 0.4px;">Túrázz Velünk</div>
                        <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Lejelentkezési kérelem</div>
                    </td>
                </tr>
                <tr>
                    <td style="background: #ffffff; padding: 28px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Lejelentkezési kérelem érkezett</h2>
                        <p style="margin: 0 0 16px; color: #334155;">Felhasználó: ${safeName}${safeEmail ? ` (${safeEmail})` : ''}</p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Túra</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 600;">${safeTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Időpont</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">${dateRange}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Indok</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">${safeReason || '-'}</td>
                            </tr>
                        </table>
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

const buildAdminCancellationApprovedEmail = ({ userName, userEmail, tourTitle, startDate, endDate }) => {
    const safeName = escapeHtml(userName || '');
    const safeEmail = escapeHtml(userEmail || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const dateRange = formatDateRange(startDate, endDate) || '-';
    const subject = `Lejelentkezés (jóváhagyva): ${safeTitle}`;
    const text = `Lejelentkezés jóváhagyva.\nFelhasználó: ${userName || '-'} (${userEmail || 'n/a'})\nTúra: ${safeTitle}\nIdőpont: ${dateRange}`;
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
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Lejelentkezés (jóváhagyva): ${safeTitle}</h2>
                        <p style="margin: 0 0 16px; color: #334155;">${safeName}${safeEmail ? ` (${safeEmail})` : ''} lejelentkezett a túráról.</p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Túra</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 600;">${safeTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Időpont</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">${dateRange}</td>
                            </tr>
                        </table>
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

const buildPaymentEmail = ({ name, tourTitle, amount, startDate, endDate }) => {
    const safeName = escapeHtml(name || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const dateRange = formatDateRange(startDate, endDate) || '-';
    const subject = `Sikeres befizetés: ${safeTitle}`;
    const text = `Szia ${safeName}!\n\nA befizetésed sikeres volt.\nTúra: ${safeTitle}\nIdőpont: ${dateRange}\nÖsszeg: ${formatPrice(amount)}\n`;
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
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Időpont</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">${dateRange}</td>
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

const buildAdminPaymentEmail = ({ userName, tourTitle, amount, startDate, endDate }) => {
    const safeName = escapeHtml(userName || '');
    const safeTitle = escapeHtml(tourTitle || '');
    const dateRange = formatDateRange(startDate, endDate) || '-';
    const subject = `Befizetés: ${safeTitle}`;
    const text = `${safeName} befizette a túrát.\nTúra: ${safeTitle}\nIdőpont: ${dateRange}\nÖsszeg: ${formatPrice(amount)}\n`;
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
                        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">Befizetés: ${safeTitle}</h2>
                        <p style="margin: 0 0 16px; color: #334155;">${safeName} befizette a túrát.</p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Túra</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 600;">${safeTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">Időpont</td>
                                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">${dateRange}</td>
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
                        Ez az üzenet a Túrázz Velünk adminisztrációjától érkezett.
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

module.exports = {
    buildRegistrationEmail,
    buildBookingEmail,
    buildBookingCancelledEmail,
    buildAdminRemovedBookingEmail,
    buildAdminRemovedBookingNotificationEmail,
    buildCancellationRequestEmail,
    buildCancellationRejectedEmail,
    buildAdminCancellationRequestEmail,
    buildAdminCancellationApprovedEmail,
    buildPaymentEmail,
    buildAdminPaymentEmail,
    buildAdminEmail,
    buildAccountDeletedEmail
};
