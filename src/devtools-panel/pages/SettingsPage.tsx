import { DiffLogSettings } from '../views/Settings/DiffLogSettings';
import { EditorSettings } from '../views/Settings/EditorSettings';
import { FilteredPathsSettings } from '../views/Settings/FilteredPathsSettings';
import { LockSettings } from '../views/Settings/LockSettings';
import { SearchSettings } from '../views/Settings/SearchSettings';

export function SettingsPage() {
  return (
    <div class="flex flex-1 bg-gray-700">
      <div class="mx-auto w-full max-w-6xl flex-1 bg-slate-900 px-6 py-3">
        <h2 class="pb-4 text-2xl font-bold">Settings</h2>
        <fieldset class="text-base">
          <legend class="text-lg font-bold">Diff Log</legend>
          <div class="grid grid-cols-[auto_1fr] gap-4">
            <DiffLogSettings />
          </div>
        </fieldset>

        <fieldset class="mt-5 text-base">
          <legend class="text-lg font-bold">Search</legend>
          <div class="grid grid-cols-[auto_1fr] gap-4">
            <SearchSettings />
          </div>
        </fieldset>

        <fieldset class="mt-5 text-base">
          <legend class="text-lg font-bold">Editor</legend>
          <div class="grid grid-cols-[auto_1fr] gap-4">
            <EditorSettings />
          </div>
        </fieldset>

        <fieldset class="mt-5 text-base">
          <legend class="mb-2 text-lg font-bold">Filtered Paths</legend>
          <FilteredPathsSettings />
        </fieldset>

        <fieldset class="mt-5 text-base">
          <legend class="mb-2 text-lg font-bold">Locked Variables</legend>
          <LockSettings />
        </fieldset>
      </div>
    </div>
  );
}
