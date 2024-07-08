import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const browser = chrome;

interface Props {
  isEnabled: boolean;
  startTime: [string | undefined, string | undefined];
  endTime: [string | undefined, string | undefined];
  days: string[];
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const minutes = [0, 10, 15, 20, 30, 40, 45, 50];

export default function TimePicker({
  isEnabled,
  startTime,
  endTime,
  days,
}: Props) {
  return (
    <>
      <ToggleGroup
        className="py-4"
        type="multiple"
        value={days}
        disabled={!isEnabled}
        onValueChange={(active: string[]) => {
          browser.storage.local.set({
            automatic: {
              isEnabled,
              startTime,
              endTime,
              days: active,
            },
          });
        }}
      >
        {weekDays.map((day) => (
          <ToggleGroupItem
            key={day}
            value={day}
            className="text-xs w-[calc((238px-24px)/7)] h-[calc((238px-24px)/7)] border"
          >
            {day[0]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex gap-2 items-center">
        <span className="font-bold mr-auto">From:</span>
        <Select
          disabled={!isEnabled}
          value={startTime[0]}
          onValueChange={(val) => {
            browser.storage.local.set({
              automatic: {
                isEnabled,
                startTime: [val, startTime[1]],
                endTime,
              },
            });
          }}
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
          onValueChange={(val) => {
            browser.storage.local.set({
              automatic: {
                isEnabled,
                startTime: [startTime[0], val],
                endTime,
              },
            });
          }}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Minutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {minutes.map((min, i) => (
                <SelectItem key={i} value={`${min}`}>
                  {min}
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
          onValueChange={(val) => {
            browser.storage.local.set({
              automatic: {
                isEnabled,
                startTime,
                endTime: [val, endTime[1]],
              },
            });
          }}
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
          onValueChange={(val) => {
            browser.storage.local.set({
              automatic: {
                isEnabled,
                startTime,
                endTime: [endTime[0], val],
              },
            });
          }}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Minutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {minutes.map((min, i) => (
                <SelectItem key={i} value={`${min}`}>
                  {min}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
