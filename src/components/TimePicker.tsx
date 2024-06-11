import * as React from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const browser = chrome;

interface Props {
  isEnabled: boolean;
  setIsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TimePicker({ isEnabled, setIsEnabled }: Props) {
  const [startTime, setStartTime] = React.useState([undefined, undefined]);
  const [endTime, setEndTime] = React.useState([undefined, undefined]);

  React.useEffect(() => {
    browser.runtime.onMessage.addListener(onMessageListener);
    function onMessageListener(message) {
      if (message.type === "get_automatic_details_reply") {
        const { isEnabled, startTime, endTime } = message.automatic;
        setIsEnabled(isEnabled);
        setStartTime([startTime[0] ?? undefined, startTime[1] ?? undefined]);
        setEndTime([endTime[0] ?? undefined, endTime[1] ?? undefined]);
      }
    }

    browser.runtime.sendMessage({
      type: "get_automatic_details",
    });

    return () => {
      browser.runtime.onMessage.removeListener(onMessageListener);
    };
  }, [setIsEnabled]);

  // sync startTime and endTime with localStorage
  React.useEffect(() => {
    browser.runtime.sendMessage({
      type: "set_automatic_details",
      automatic: {
        isEnabled: isEnabled,
        startTime,
        endTime,
      },
    });
  }, [isEnabled, startTime, endTime]);

  return (
    <>
      <div className="flex gap-2 items-center">
        <span className="font-bold mr-auto">From:</span>
        <Select
          disabled={!isEnabled}
          value={startTime[0]}
          onValueChange={(val) => setStartTime((prev) => [val, prev[1]])}
        >
          <SelectTrigger className="w-[88px]">
            <SelectValue placeholder="Hours" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Array.from({ length: 24 }).map((_, i) => (
                <SelectItem key={i} value={`${i}`}>
                  {i}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          disabled={!isEnabled}
          value={startTime[1]}
          onValueChange={(val) => setStartTime((prev) => [prev[0], val])}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Minutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Array.from({ length: 60 }).map((_, i) => (
                <SelectItem key={i} value={`${i}`}>
                  {i}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 items-center mt-4">
        <span className="font-bold mr-auto">To:</span>
        <Select
          disabled={!isEnabled}
          value={endTime[0]}
          onValueChange={(val) => setEndTime((prev) => [val, prev[1]])}
        >
          <SelectTrigger className="w-[88px]">
            <SelectValue placeholder="Hours" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Array.from({ length: 24 }).map((_, i) => (
                <SelectItem key={i} value={`${i}`}>
                  {i}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          disabled={!isEnabled}
          value={endTime[1]}
          onValueChange={(val) => setEndTime((prev) => [prev[0], val])}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Minutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Array.from({ length: 60 }).map((_, i) => (
                <SelectItem key={i} value={`${i}`}>
                  {i}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
