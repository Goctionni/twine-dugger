import { copy } from '@/shared/copy';
import type {
  AddInstruction,
  Instruction,
  MatchPair,
  MoveInstruction,
  RemoveInstruction,
  Value,
} from '@/shared/shared-types';

function createRawAddInstructions(newArr: Value[], newMatched: boolean[]) {
  const rawAddInstructions: AddInstruction[] = [];
  for (let i = 0; i < newMatched.length; i++) {
    if (!newMatched[i]) {
      rawAddInstructions.push({ type: 'add', value: newArr[i], index: i });
    }
  }
  return rawAddInstructions;
}

function createRawRemoveInstrunctions(oldMatched: boolean[]) {
  const rawRemoveInstructions: RemoveInstruction[] = [];
  for (let i = oldMatched.length - 1; i >= 0; i--) {
    if (!oldMatched[i]) {
      rawRemoveInstructions.push({ type: 'remove', index: i });
    }
  }
  return rawRemoveInstructions;
}

function createRawMoveInstructions(matchedPairs: MatchPair[]) {
  const rawMoveInstructions: MoveInstruction[] = [];
  for (const matchPair of matchedPairs) {
    rawMoveInstructions.push({
      type: 'move',
      from: matchPair.oldIndex,
      to: matchPair.newIndex,
    });
  }
  return rawMoveInstructions;
}

function createRawInstructions(
  newArr: Value[],
  oldMatched: boolean[],
  newMatched: boolean[],
  matchedPairs: MatchPair[],
): Instruction[] {
  return [
    ...createRawRemoveInstrunctions(oldMatched),
    ...createRawAddInstructions(newArr, newMatched),
    ...createRawMoveInstructions(matchedPairs),
  ];
}

function getInstructionTargetIndex(item: Instruction): number {
  if (item.type === 'remove') return item.index;
  if (item.type === 'add') return item.index;
  return item.to;
}

// Order instructions based on target index
// But if the index is the same, do removals before add/move
function orderRawInstructions(instructions: Instruction[]): Instruction[] {
  return instructions.toSorted((a, b) => {
    const indexA = getInstructionTargetIndex(a);
    const indexB = getInstructionTargetIndex(b);
    if (a.type === b.type) {
      if (a.type === 'remove') return indexB - indexA;
      return indexA - indexB;
    }
    if (a.type === 'remove') return -1;
    if (b.type === 'remove') return 1;
    return indexA - indexB;
  });
}

function forwardPropagateIndexAdjustments(instructionsBase: Instruction[]) {
  const instructions = copy(instructionsBase) as Instruction[];
  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i]!;
    const downstreamInstructions = instructions.slice(i + 1);

    if (instruction.type === 'add') {
      for (const downstreamInstruction of downstreamInstructions) {
        if (
          downstreamInstruction.type === 'move' &&
          downstreamInstruction.from >= instruction.index
        ) {
          downstreamInstruction.from += 1;
        }
      }
    } else if (instruction.type === 'move' && instruction.from !== instruction.to) {
      for (const downstreamInstruction of downstreamInstructions) {
        // If the current instruction moves an item from behind the downstream 'from' to in front of the downstream 'from'
        if (
          downstreamInstruction.type === 'move' &&
          instruction.from >= downstreamInstruction.from &&
          instruction.to <= downstreamInstruction.from
        ) {
          downstreamInstruction.from += 1;
        }
      }
    } else if (instruction.type === 'remove') {
      for (const downstreamInstruction of downstreamInstructions) {
        if (
          downstreamInstruction.type === 'move' &&
          downstreamInstruction.from > instruction.index
        ) {
          downstreamInstruction.from -= 1;
        }
      }
    }
  }
  return instructions;
}

export function createInstructions(
  newArr: Value[],
  oldMatched: boolean[],
  newMatched: boolean[],
  matchedPairs: MatchPair[],
): Instruction[] {
  const rawInstructions = createRawInstructions(newArr, oldMatched, newMatched, matchedPairs);
  const sortedInstructions = orderRawInstructions(rawInstructions);
  const indexAdjustedInstructions = forwardPropagateIndexAdjustments(sortedInstructions);
  // Remove 'move-in-place' instructions
  const finalInstructions = indexAdjustedInstructions.filter((instruction) => {
    if (instruction.type !== 'move') return true;
    return instruction.from !== instruction.to;
  });
  return finalInstructions;
}
