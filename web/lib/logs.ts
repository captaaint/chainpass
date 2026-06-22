const DEFAULT_LOG_BLOCK_RANGE = BigInt(
  process.env.LOG_BLOCK_RANGE ?? process.env.NEXT_PUBLIC_LOG_BLOCK_RANGE ?? "9999",
);

type BlockRange = {
  fromBlock: bigint;
  toBlock: bigint;
};

type GetEventsForRange<TLog> = (range: BlockRange) => Promise<TLog[]>;

export async function getContractEventsInBlockRanges<TLog>({
  fromBlock,
  toBlock,
  rangeSize = DEFAULT_LOG_BLOCK_RANGE,
  getEvents,
}: {
  fromBlock: bigint;
  toBlock: bigint;
  rangeSize?: bigint;
  getEvents: GetEventsForRange<TLog>;
}) {
  const logs: TLog[] = [];

  for (let rangeStart = fromBlock; rangeStart <= toBlock; rangeStart += rangeSize + 1n) {
    const rangeEnd = rangeStart + rangeSize > toBlock ? toBlock : rangeStart + rangeSize;
    const rangeLogs = await getEvents({ fromBlock: rangeStart, toBlock: rangeEnd });
    logs.push(...rangeLogs);
  }

  return logs;
}
