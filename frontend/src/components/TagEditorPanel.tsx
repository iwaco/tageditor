import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@astryxdesign/core/Button";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { IconButton } from "@astryxdesign/core/IconButton";
import { List, ListItem } from "@astryxdesign/core/List";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { Minus, Plus } from "lucide-react";

interface Props {
  selectedCount: number;
  commonTags: string[];
  allTags: string[];
  onAddTags: (tags: string[]) => Promise<void> | void;
  onRemoveTag: (tag: string) => Promise<void> | void;
  onFilterInclude: (tag: string) => void;
  onFilterExclude: (tag: string) => void;
  addToFront: boolean;
  onChangeAddToFront: (value: boolean) => void;
  /** Touch layout: larger controls, and the tag cloud sizes to its content instead of a drag handle. */
  isTouch?: boolean;
}

function parseInputTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function TagEditorPanel({
  selectedCount,
  commonTags,
  allTags,
  onAddTags,
  onRemoveTag,
  onFilterInclude,
  onFilterExclude,
  addToFront,
  onChangeAddToFront,
  isTouch = false,
}: Props) {
  const size = isTouch ? "lg" : "sm";
  const iconSize = isTouch ? 16 : 12;
  const [input, setInput] = useState("");
  const [tagCloudHeight, setTagCloudHeight] = useState(224);
  const [resizingTagCloud, setResizingTagCloud] = useState(false);
  const dragStartRef = useRef<{ y: number; h: number } | null>(null);

  useEffect(() => {
    if (!resizingTagCloud) return;

    const onMouseMove = (e: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const next = start.h + (e.clientY - start.y);
      setTagCloudHeight(Math.max(120, Math.min(520, next)));
    };
    const onMouseUp = () => {
      setResizingTagCloud(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizingTagCloud]);

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return allTags.slice(0, 30);
    return allTags.filter((t) => t.toLowerCase().includes(q)).slice(0, 30);
  }, [allTags, input]);

  if (!selectedCount) {
    return (
      <div className="side-pane side-pane-right">
        <Text size="sm" color="secondary">
          No image selected
        </Text>
      </div>
    );
  }

  const addTags = (raw: string) => {
    const incoming = parseInputTags(raw);
    if (!incoming.length) return;
    onAddTags(incoming);
    setInput("");
  };

  return (
    <div className="side-pane side-pane-right">
      <Text as="h2" type="label" weight="semibold" className="pane-heading">
        Tag Cloud (Common)
      </Text>
      <Text size="sm" color="secondary" className="pane-subheading">
        Selected: {selectedCount} images
      </Text>
      <div className="tag-cloud" style={isTouch ? undefined : { height: `${tagCloudHeight}px` }}>
        <HStack gap={1.5} wrap="wrap">
          {commonTags.map((tag) => (
            <span key={tag} className="tag-chip">
              <IconButton
                label={`Include ${tag}`}
                tooltip="include"
                size={size}
                variant="ghost"
                icon={<Plus size={iconSize} />}
                onClick={() => onFilterInclude(tag)}
              />
              <IconButton
                label={`Exclude ${tag}`}
                tooltip="exclude"
                size={size}
                variant="ghost"
                icon={<Minus size={iconSize} />}
                onClick={() => onFilterExclude(tag)}
              />
              <Token label={tag} size={size} onRemove={() => onRemoveTag(tag)} />
            </span>
          ))}
        </HStack>
      </div>
      {isTouch ? (
        <div className="tag-cloud-gap" />
      ) : (
        <div
          className="resize-handle resize-handle-row tag-cloud-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            dragStartRef.current = { y: e.clientY, h: tagCloudHeight };
            setResizingTagCloud(true);
          }}
        />
      )}

      <VStack gap={2} paddingBlockEnd={4}>
        <TextInput
          label="Add tags (comma separated)"
          size={size}
          value={input}
          onChange={setInput}
          onEnter={() => addTags(input)}
          placeholder="1girl, blue eyes"
        />
        <CheckboxInput label="Add to front" size={isTouch ? "md" : "sm"} value={addToFront} onChange={onChangeAddToFront} />
        <Button label="Add" variant="primary" size={size} onClick={() => addTags(input)} />
      </VStack>

      <Text as="h3" type="label" weight="semibold" color="secondary" className="pane-heading">
        Autocomplete
      </Text>
      <div className="scroll-area">
        <List density={isTouch ? "balanced" : "compact"} aria-label="Autocomplete">
          {suggestions.map((tag) => (
            <ListItem key={tag} itemKey={tag} label={tag} onClick={() => addTags(tag)} />
          ))}
        </List>
      </div>
    </div>
  );
}
