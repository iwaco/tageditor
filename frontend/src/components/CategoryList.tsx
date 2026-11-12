import { Text } from "@astryxdesign/core/Text";
import { TreeList, type TreeListItemData } from "@astryxdesign/core/TreeList";

interface Props {
  categories: string[];
  current: string;
  onSelect: (category: string) => void;
  /** Roomier rows for touch screens. */
  isTouch?: boolean;
}

export function CategoryList({ categories, current, onSelect, isTouch = false }: Props) {
  const categoryItems: TreeListItemData[] = ["all", ...categories].map((c) => ({
    id: c,
    label: c === "all" ? "All" : c,
    isSelected: current === c,
    onClick: () => onSelect(c),
  }));

  return (
    <>
      <Text as="h2" type="label" weight="semibold" className="pane-heading">
        Categories
      </Text>
      <div className="scroll-area">
        <TreeList
          items={categoryItems}
          density={isTouch ? "spacious" : "compact"}
          variant="noGuides"
          aria-label="Categories"
        />
      </div>
    </>
  );
}
