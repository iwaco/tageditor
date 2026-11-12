import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack } from "@astryxdesign/core/Stack";
import { Table, pixel, proportional, type TableColumn } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { Minus, Plus } from "lucide-react";
import type { TagStats } from "../types/models";

interface Props {
  stats: TagStats[];
  onIncludeTag: (tag: string) => void;
  onExcludeTag: (tag: string) => void;
  /** Larger buttons for touch screens. */
  isTouch?: boolean;
}

type StatRow = { tag: string; count: number };

export function TagStatsPanel({ stats, onIncludeTag, onExcludeTag, isTouch = false }: Props) {
  const rows: StatRow[] = stats.slice(0, 100).map((s) => ({ tag: s.tag, count: s.count }));
  const columns: TableColumn<StatRow>[] = [
    { key: "tag", header: "Tag", width: proportional(3) },
    { key: "count", header: "Count", width: pixel(72), align: "end" },
    {
      key: "filter",
      header: "Filter",
      width: pixel(isTouch ? 96 : 88),
      align: "end",
      renderCell: (row) => (
        <HStack gap={1} justify="end">
          <IconButton
            label="Include this tag"
            tooltip="Include this tag"
            size={isTouch ? "lg" : "sm"}
            variant="secondary"
            icon={<Plus size={isTouch ? 16 : 12} />}
            onClick={() => onIncludeTag(row.tag)}
          />
          <IconButton
            label="Exclude this tag"
            tooltip="Exclude this tag"
            size={isTouch ? "lg" : "sm"}
            variant="secondary"
            icon={<Minus size={isTouch ? 16 : 12} />}
            onClick={() => onExcludeTag(row.tag)}
          />
        </HStack>
      ),
    },
  ];

  return (
    <div className="stats-pane">
      <Text as="h2" type="label" weight="semibold" className="pane-heading">
        Tag Frequency
      </Text>
      <div className="stats-scroll">
        <Table data={rows} columns={columns} idKey="tag" density="compact" dividers="rows" textOverflow="truncate" />
      </div>
    </div>
  );
}
