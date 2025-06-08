import { onCleanup, onMount } from 'solid-js';
import { FontSize } from './FontSize';
import { DiffLogSeparation } from './DiffLogSeperation';
import { DiffPolling } from './DiffFramesPolling'

interface SettingsProps {
  onClose: () => void;
}

export function Settings(props: SettingsProps) {
  let modalRef: HTMLDivElement | undefined;

  const handlePointerDownOutside = (event: PointerEvent) => {
    if (modalRef && !modalRef.contains(event.target as Node)) {
      props.onClose();
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      props.onClose();
    }
  };

  onMount(() => {
    setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDownOutside);
      window.addEventListener('keydown', handleEscape);
    });
  });

  onCleanup(() => {
    window.removeEventListener('pointerdown', handlePointerDownOutside);
    window.removeEventListener('keydown', handleEscape);
  });

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        class="relative rounded-xl shadow-lg w-full max-w-md animate-slide-in bg-gray-900"
      >
        {/* Top Bar */}
        <div class="flex items-center justify-between px-6 py-4 bg-gray-800 rounded-t-xl">
          <h2 class="text-xl font-bold text-sky-400">Settings</h2>
          <button
            class="text-gray-400 hover:text-sky-400 text-xl cursor-pointer"
            aria-label="Close settings"
            onClick={props.onClose}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div class="p-6">
          <FontSize />
          <DiffLogSeparation />
          <DiffPolling />
        </div>
      </div>
    </div>
  );
}