export const SITE_NAME = "Safe Steps";
export const SITE_TAGLINE = "Learn to cross the road safely";
export const SITE_DESCRIPTION =
  "A playful way for kids to learn how to spot a safe place and a safe moment to cross the road.";

/**
 * 절대 URL 이 필요한 곳(OG 이미지, canonical)에 쓴다.
 *
 * 우선순위가 중요하다:
 *  1. NEXT_PUBLIC_SITE_URL — 직접 지정한 값. 커스텀 도메인이 붙으면 이걸 쓴다.
 *  2. VERCEL_PROJECT_PRODUCTION_URL — 프로덕션 도메인. 배포마다 바뀌지 않는다.
 *  3. VERCEL_URL — 배포마다 달라지는 임시 주소. 마지막 수단이다.
 *
 * VERCEL_URL 을 먼저 쓰면 링크 미리보기의 og:image 가 그 배포에만 있는 주소를
 * 가리키게 되어, 다음 배포 후 예전에 공유한 링크의 그림이 깨진다.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const ROUTES = {
  home: "/",
  game: "/game",
} as const;
