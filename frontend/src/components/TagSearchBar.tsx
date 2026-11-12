import { Button } from "@astryxdesign/core/Button";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { HStack } from "@astryxdesign/core/Stack";
import { TextInput } from "@astryxdesign/core/TextInput";

export type TagSearchMode = "include" | "exclude";

interface Props {
  mode: TagSearchMode;
  onChangeMode: (mode: TagSearchMode) => void;
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  /** Stacked, full-width controls for the compact layout. */
  isTouch?: boolean;
  className?: string;
}

export function TagSearchBar({ mode, onChangeMode, value, onChange, onApply, onClear, isTouch = false, className }: Props) {
  const size = isTouch ? "lg" : "sm";
  const modeControl = (
    <SegmentedControl
      label="Tag search mode"
      size={size}
      value={mode}
      onChange={(v) => onChangeMode(v === "exclude" ? "exclude" : "include")}
      className={isTouch ? "tag-search-mode" : undefined}
    >
      <SegmentedControlItem value="include" label="Include" />
      <SegmentedControlItem value="exclude" label="Exclude" />
    </SegmentedControl>
  );
  const input = (
    <TextInput
      label="Tag search"
      isLabelHidden
      size={size}
      width={isTouch ? "100%" : 220}
      value={value}
      onChange={onChange}
      onEnter={onApply}
      placeholder="Tag search"
    />
  );
  const buttons = (
    <>
      <Button label="Apply" variant="primary" size={size} onClick={onApply} />
      <Button label="Clear" variant="secondary" size={size} onClick={onClear} />
    </>
  );

  if (!isTouch) {
    return (
      <HStack gap={2} align="center" className={className}>
        {modeControl}
        {input}
        {buttons}
      </HStack>
    );
  }

  return (
    <div className={`tag-search-stack ${className ?? ""}`}>
      {modeControl}
      <HStack gap={2} align="center">
        <div className="tag-search-input">{input}</div>
        {buttons}
      </HStack>
    </div>
  );
}
