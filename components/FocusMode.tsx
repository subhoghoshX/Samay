import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useToast } from "@/components/ui/use-toast";
import TimePicker from "./TimePicker";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useAutomaticMode, useFocusMode } from "@/lib/utils";

const browser = chrome;

export default function FocusModeCard() {
  const { isEnabled, blockedSites } = useFocusMode();
  const {
    isEnabled: isAutomatic,
    startTime,
    endTime,
    days,
  } = useAutomaticMode();
  const [input, setInput] = useState("");
  const { toast } = useToast();

  function addSiteToBlockList(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() === "") return;

    browser.storage.local.set({
      focusMode: {
        isEnabled,
        blockedSites: [...blockedSites, input],
      },
    });

    setInput("");
  }

  function removeSiteFromBlockList(domain: string) {
    const copy = [...blockedSites];
    const index = blockedSites.indexOf(domain);
    if (index > -1) {
      copy.splice(index, 1);
    }

    browser.storage.local.set({
      focusMode: {
        isEnabled,
        blockedSites: copy,
      },
    });
  }

  function toggleFocusMode(isChecked: boolean) {
    if (isAutomatic) {
      toast({
        title: "Automatic mode is active.",
        description:
          "Focus mode will automatically enable/disable in less than 5 minutes based on your settings.",
      });
    }

    browser.storage.local.set({
      focusMode: {
        isEnabled: isChecked,
        blockedSites,
      },
    });
  }

  return (
    <Card className="lg:w-96 flex flex-col lg:h-1/2 h-80" id="focusmode">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-3">
          <HoverCard>
            <HoverCardTrigger>Focus mode</HoverCardTrigger>
            <HoverCardContent className="text-sm">
              When you need time to focus, enable focus mode to block
              distracting sites from opening.
            </HoverCardContent>
          </HoverCard>
          <Switch
            checked={isEnabled}
            onCheckedChange={toggleFocusMode}
            className="ml-auto"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="size-7">
                <Bot className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <CardHeader className="p-2">
                <CardTitle className="text-lg flex items-center">
                  Automatic
                  <Switch
                    className="ml-auto"
                    checked={isAutomatic}
                    onCheckedChange={(bool) => {
                      browser.storage.local.set({
                        automatic: {
                          isEnabled: bool,
                          startTime,
                          endTime,
                          days,
                        },
                      });
                    }}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <TimePicker
                  isEnabled={isAutomatic}
                  startTime={startTime}
                  endTime={endTime}
                  days={days}
                />
              </CardContent>
            </PopoverContent>
          </Popover>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <form className="flex gap-1" onSubmit={addSiteToBlockList}>
          <Input
            placeholder="Enter domain..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button variant="outline">Add</Button>
        </form>
        <ScrollArea className="h-[163px] mt-5 -mx-6">
          <ul className="px-6">
            {blockedSites.map((site) => (
              <li
                className="flex justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 px-2 -mx-2 py-1 rounded"
                key={site}
              >
                {site}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-4"
                  onClick={() => removeSiteFromBlockList(site)}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
