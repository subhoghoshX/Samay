import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const browser = chrome;

export default function FocusModeCard() {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [blockedSites, setBlockedSites] = React.useState([]);
  const [input, setInput] = React.useState("");

  React.useEffect(() => {
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
  }

  return (
    <Card className="lg:w-96 flex flex-col lg:h-1/2 h-80">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Focus mode
          <Switch checked={isEnabled} onCheckedChange={toggleFocusMode} />
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
        <ScrollArea className="h-[163px] mt-5 -mx-6 px-6">
          <ul className="">
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
