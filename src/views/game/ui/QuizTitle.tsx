/**
 * 질문 팝업의 제목 — 문장이 끝날 때마다 줄을 나눈다.
 *
 * 그대로 두면 폭이 차는 자리에서 끊겨 "You are riding your bike. What should you /
 * take?" 처럼 문장 한가운데가 갈린다. 상황을 말하는 문장과 실제로 묻는 문장이
 * 한 줄에 섞이니 무엇을 고르라는 것인지 한눈에 안 들어온다.
 *
 * 문장마다 한 줄을 주되, 한 문장이 폭보다 길면 그 안에서는 평소대로 접힌다 —
 * 줄바꿈을 글에 직접 박아 넣으면 좁은 화면에서 오히려 이상하게 갈린다.
 */
export function QuizTitle({ id, children }: { id: string; children: string }) {
  // 문장부호까지가 한 문장. 뒤따르는 공백도 같이 가져가야 접근성 이름을 계산할 때
  // 문장 사이가 붙지 않는다("...bike.What should...").
  const sentences = children.match(/[^.!?]+[.!?]*\s*/g) ?? [children];

  return (
    <h2
      id={id}
      className="text-center font-[family-name:var(--font-baloo)] text-3xl font-extrabold text-slate-800"
    >
      {sentences.map((sentence, i) => (
        <span key={`s${i}`} className="block">
          {sentence}
        </span>
      ))}
    </h2>
  );
}
