import { DiffLogSettings } from '../views/Settings/DiffLogSettings';

export function SettingsPage() {
  return (
    <div class="bg-gray-700 flex-1 flex">
      <div class="mx-auto max-w-6xl w-full bg-slate-900 flex-1 py-3 px-6">
        <h2 class="text-2xl font-bold pb-4">Settings</h2>
        <fieldset class="text-base">
          <legend class="text-lg font-bold">Diff Log</legend>
          <div class="grid grid-cols-[auto_1fr] gap-4">
            <DiffLogSettings />
          </div>
        </fieldset>
      </div>
    </div>
  );
}
