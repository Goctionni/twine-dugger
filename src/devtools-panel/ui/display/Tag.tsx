interface TagProps {
  tag: string;
}

const lightness = 0.45;
const chrome = 0.18;

export function Tag(props: TagProps) {
  const hue = () => hashToHue(props.tag.toLowerCase());
  const bg = () => `oklch(${lightness} ${chrome} ${hue()}deg)`;

  return (
    <span
      class="inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium text-white shadow-sm"
      style={{ 'background-color': bg() }}
    >
      {props.tag}
    </span>
  );
}

function hashToHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return ((h % 360) + 360) % 360; // 0–360
}
