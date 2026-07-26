import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/shared/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;

/**
 * 링크 미리보기 카드.
 *
 * 스크린샷을 파일로 넣는 대신 코드로 그린다 — 문구나 색을 바꿔도 이미지를 다시
 * 만들 필요가 없고, 리포지토리에 큰 PNG 가 쌓이지 않는다.
 * 얼굴은 파비콘과 같은 도형·색이라 탭 아이콘과 미리보기가 같은 인물로 읽힌다.
 */
export default function Image() {
  const green = "#62b73a";
  const greenLight = "#7ecb4f";
  const muzzle = "#8ad25c";
  const orange = "#f0871f";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 72,
          background: "linear-gradient(160deg, #8fd0f5 0%, #b9e4f7 55%, #d8f0e2 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* 공룡 얼굴 */}
        <div style={{ position: "relative", width: 300, height: 300, display: "flex" }}>
          <div style={{ position: "absolute", left: 116, top: 22, width: 30, height: 44, background: orange }} />
          <div style={{ position: "absolute", left: 158, top: 12, width: 30, height: 54, background: orange }} />
          <div style={{ position: "absolute", left: 26, top: 58, width: 226, height: 188, borderRadius: 22, background: green }} />
          <div style={{ position: "absolute", left: 26, top: 58, width: 226, height: 34, borderRadius: 22, background: greenLight }} />
          <div style={{ position: "absolute", left: 60, top: 108, width: 58, height: 64, borderRadius: 8, background: "#fdfdf8" }} />
          <div style={{ position: "absolute", left: 172, top: 108, width: 58, height: 64, borderRadius: 8, background: "#fdfdf8" }} />
          <div style={{ position: "absolute", left: 76, top: 124, width: 28, height: 34, background: "#26221f" }} />
          <div style={{ position: "absolute", left: 188, top: 124, width: 28, height: 34, background: "#26221f" }} />
          <div style={{ position: "absolute", left: 60, top: 186, width: 170, height: 50, borderRadius: 14, background: muzzle }} />
          <div style={{ position: "absolute", left: 92, top: 206, width: 106, height: 14, borderRadius: 7, background: "#3c6f22" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ fontSize: 92, fontWeight: 800, color: "#2b3a45", lineHeight: 1.05 }}>
            {SITE_NAME}
          </div>
          <div style={{ marginTop: 18, fontSize: 40, fontWeight: 700, color: "#41586a" }}>
            {SITE_TAGLINE}
          </div>
          <div style={{ marginTop: 28, fontSize: 30, fontWeight: 600, color: "#5a7385" }}>
            A place where getting it wrong is safe.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
