import { getSettings, setSetting } from '@/devtools-panel/store/store';

interface RememberOptionProps {
  label: string;
  description: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}

function RememberOption(props: RememberOptionProps) {
  return (
    <label class="flex cursor-pointer items-start gap-2.5 border-t border-slate-800 py-2 first:border-t-0">
      <input
        type="checkbox"
        class="mt-0.75 h-4 w-4 check-box shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        checked={props.isChecked}
        onChange={(event) => props.onChange(event.currentTarget.checked)}
      />
      <span>
        <span class="block font-medium">{props.label}</span>
        <span class="block text-[13px] text-gray-400">{props.description}</span>
      </span>
    </label>
  );
}

export function SearchSettings() {
  const { persist } = getSettings.search;

  return (
    <fieldset>
      <legend class="pt-3 pb-1 font-medium">
        Remember for next time:
        <span class="block text-[13px] font-normal text-gray-400">
          What the search remembers between sessions.
        </span>
      </legend>
      <RememberOption
        label="Match Case, Whole Word, Regex"
        description="The three switches next to the search box."
        isChecked={persist.options()}
        onChange={(value) => setSetting('search.persist.options', value)}
      />
      <RememberOption
        label="Search scope"
        description="What is searched in: names, values, tags and passage content."
        isChecked={persist.scope()}
        onChange={(value) => setSetting('search.persist.scope', value)}
      />
      <RememberOption
        label="Sort order"
        description="How the results are sorted."
        isChecked={persist.sort()}
        onChange={(value) => setSetting('search.persist.sort', value)}
      />
      <RememberOption
        label="Value types"
        description="Which types of values the results show."
        isChecked={persist.typeFilter()}
        onChange={(value) => setSetting('search.persist.typeFilter', value)}
      />
    </fieldset>
  );
}
