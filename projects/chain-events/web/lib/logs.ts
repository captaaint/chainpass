export function getBlockRanges(fromBlock: bigint, toBlock: bigint, blockRange: bigint) {
  if (toBlock < fromBlock) {
    return [];
  }

  const ranges: Array<{ fromBlock: bigint; toBlock: bigint }> = [];
  let cursor = fromBlock;

  while (cursor <= toBlock) {
    const rangeEnd = cursor + blockRange - BigInt(1);
    const nextToBlock = rangeEnd > toBlock ? toBlock : rangeEnd;
    ranges.push({ fromBlock: cursor, toBlock: nextToBlock });
    cursor = nextToBlock + BigInt(1);
  }

  return ranges;
}
