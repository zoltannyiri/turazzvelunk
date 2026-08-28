UPDATE notifications n
LEFT JOIN tours t ON n.title LIKE CONCAT('%', t.title, '%')
SET
  n.type = CASE WHEN t.id IS NOT NULL THEN 'tour' ELSE 'account' END,
  n.title = CASE
    WHEN n.title = 'Sikeres regisztráció a Túrázz Velünk oldalra'
      THEN 'Üdv a Túrázz Velünk közösségében!'
    WHEN n.title LIKE '%Jelentkezésed jóváhagyva:%'
      THEN CONCAT('Jelentkezésed jóváhagyva: ', t.title)
    WHEN n.title LIKE 'Jelentkezés rögzítve:%'
      THEN CONCAT('Jelentkezés elküldve: ', t.title)
    WHEN n.title LIKE 'Lejelentkezés visszaigazolás:%'
      THEN CONCAT('Jelentkezés lemondva: ', t.title)
    WHEN n.title LIKE 'Jelentkezésed törölve lett:%'
      THEN CONCAT('Jelentkezésed törölve: ', t.title)
    WHEN n.title LIKE 'Lejelentkezési kérelem rögzítve:%'
      THEN CONCAT('Lejelentkezési kérelem elküldve: ', t.title)
    WHEN n.title LIKE 'Lejelentkezési kérelem elutasítva:%'
      THEN CONCAT('Lejelentkezési kérelem elutasítva: ', t.title)
    WHEN n.title LIKE 'Sikeres befizetés:%'
      THEN CONCAT('Sikeres fizetés: ', t.title)
    WHEN n.title LIKE 'Várólistára kerültél:%'
      THEN CONCAT('Várólistára kerültél: ', t.title)
    WHEN n.title LIKE '%Bekerültél a résztvevők közé!%'
      THEN CONCAT('Felszabadult egy hely: ', t.title)
    ELSE n.title
  END,
  n.message = CASE
    WHEN n.title = 'Sikeres regisztráció a Túrázz Velünk oldalra'
      THEN 'A regisztrációd sikeresen elkészült.'
    WHEN n.title LIKE '%Jelentkezésed jóváhagyva:%'
      THEN 'A jelentkezésedet jóváhagytuk. A fizetési részleteket a túra oldalán találod.'
    WHEN n.title LIKE 'Jelentkezés rögzítve:%'
      THEN 'A jelentkezésed jóváhagyásra vár.'
    WHEN n.title LIKE 'Lejelentkezés visszaigazolás:%'
      THEN 'A lejelentkezésedet rögzítettük.'
    WHEN n.title LIKE 'Jelentkezésed törölve lett:%'
      THEN 'Az adminisztrátor törölte a jelentkezésedet.'
    WHEN n.title LIKE 'Lejelentkezési kérelem rögzítve:%'
      THEN 'A kérelmed elbírálásra vár.'
    WHEN n.title LIKE 'Lejelentkezési kérelem elutasítva:%'
      THEN 'A jelentkezésed továbbra is aktív.'
    WHEN n.title LIKE 'Sikeres befizetés:%'
      THEN 'A befizetésedet sikeresen rögzítettük.'
    WHEN n.title LIKE 'Várólistára kerültél:%'
      THEN 'Értesítünk, ha felszabadul egy hely.'
    WHEN n.title LIKE '%Bekerültél a résztvevők közé!%'
      THEN 'Felszabadult egy hely, a jelentkezésed aktív.'
    ELSE n.message
  END,
  n.link = CASE
    WHEN t.id IS NOT NULL THEN CONCAT('/tours/', t.id)
    WHEN n.title = 'Sikeres regisztráció a Túrázz Velünk oldalra' THEN '/profile'
    ELSE n.link
  END
WHERE n.type = 'email'
  AND (
    n.title = 'Sikeres regisztráció a Túrázz Velünk oldalra'
    OR n.title LIKE '%Jelentkezésed jóváhagyva:%'
    OR n.title LIKE 'Jelentkezés rögzítve:%'
    OR n.title LIKE 'Lejelentkezés visszaigazolás:%'
    OR n.title LIKE 'Jelentkezésed törölve lett:%'
    OR n.title LIKE 'Lejelentkezési kérelem rögzítve:%'
    OR n.title LIKE 'Lejelentkezési kérelem elutasítva:%'
    OR n.title LIKE 'Sikeres befizetés:%'
    OR n.title LIKE 'Várólistára kerültél:%'
    OR n.title LIKE '%Bekerültél a résztvevők közé!%'
  );
