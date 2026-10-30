/** A game of SugarCube that has taken the API out of the page: there is nothing to read or change */
export function ApiBlocked() {
  return (
    <div class="m-auto flex max-w-md flex-col gap-3">
      <h2 class="text-lg font-bold">This game has blocked access to the SugarCube API</h2>
      <p>
        TwineDugger cannot access the API's required for tracking or updating the game-state or
        passages.
      </p>
    </div>
  );
}
