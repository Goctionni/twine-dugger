interface TagProps {
  tag: string;
}

const lightness = 0.45;
const chroma = 0.18;

export function Tag(props: TagProps) {
  const bg = () => getTagColor(props.tag);

  return (
    <span
      class="inline-flex items-center self-center rounded-sm px-2.5 py-1 text-xs font-medium text-white shadow-sm"
      style={{ 'background-color': bg() }}
    >
      {props.tag}
    </span>
  );
}

/** The background of a tag: the same tag always has the same color */
export const getTagColor = (tag: string) =>
  `oklch(${lightness} ${chroma} ${hashToHue(tag.toLowerCase())}deg)`;

function hashToHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return ((h % 360) + 360) % 360; // 0–360
}
