import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import TimePicker from "./TimePicker";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const browser = chrome;

export default function FocusModeCard() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [blockedSites, setBlockedSites] = useState([]);
  const [input, setInput] = useState("");
  const [isAutomatic, setIsAutomatic] = useState(false);

  useEffect(() => {
    browser.runtime.onMessage.addListener(onMessageListener);
    function onMessageListener(message) {
      if (message.type === "get_focusmode_details_reply") {
        setIsEnabled(message.focusMode.isEnabled);
        setBlockedSites(message.focusMode.blockedSites);
      }
    }

    browser.runtime.sendMessage({
      type: "get_focusmode_details",
    });

    return () => {
      browser.runtime.onMessage.removeListener(onMessageListener);
    };
  }, []);

  function addSiteToBlockList(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() === "") return;

    setBlockedSites((blockedSites) => [...blockedSites, input]);
    setInput("");

    browser.runtime.sendMessage({
      type: "set_focusmode_details",
      focusMode: {
        isEnabled,
        blockedSites: [...blockedSites, input],
      },
    });
  }

  function removeSiteFromBlockList(domain: string) {
    const copy = [...blockedSites];
    const index = blockedSites.indexOf(domain);
    if (index > -1) {
      copy.splice(index, 1);
    }
    setBlockedSites(copy);
    browser.runtime.sendMessage({
      type: "set_focusmode_details",
      focusMode: {
        isEnabled,
        blockedSites: copy,
      },
    });
  }

  function toggleFocusMode(isChecked: boolean) {
    setIsEnabled(isChecked);
    browser.runtime.sendMessage({
      type: "set_focusmode_details",
      focusMode: {
        isEnabled: isChecked,
        blockedSites,
      },
    });
    setIsAutomatic(false);
  }

  return (
    <Card className="lg:w-96 flex flex-col lg:h-1/2 h-80">
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
                <Settings className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <CardHeader className="p-2">
                <CardTitle className="text-lg flex items-center">
                  Automatic
                  <Switch
                    className="ml-auto"
                    checked={isAutomatic}
                    onCheckedChange={(bool) => setIsAutomatic(bool)}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <TimePicker
                  isEnabled={isAutomatic}
                  setIsEnabled={setIsAutomatic}
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
            {blockedSites.map((site, i) => (
              <li
                className="flex justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 px-2 -mx-2 py-1 rounded"
                key={i}
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
