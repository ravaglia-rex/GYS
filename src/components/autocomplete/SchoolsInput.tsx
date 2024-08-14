import * as React from "react";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { LoadingSpinner as Spinner } from "../ui/spinner";

interface School {
  id: string;
  name: string;
}

interface SchoolsInputProps {
  schools: School[];
  onSelect: (schoolId: string, schoolName?: string) => void;
  className?: string;
  loading: boolean;
}

const SchoolsInput: React.FC<SchoolsInputProps> = ({
  schools,
  onSelect,
  className,
  loading,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [selectedValue, setSelectedValue] = React.useState("");

  const filteredSchools = React.useMemo(() => {
    if (!inputValue) return schools;

    const lowerCasedInput = inputValue.toLowerCase();
    const filtered = schools.filter((school) => {
      if (!school.name) return false;

      const lowerCasedName = school.name.toLowerCase();
      const initials = lowerCasedName
        .split(" ")
        .filter((word) => word.length > 0)
        .map((word) => word[0])
        .join("");

      return (
        lowerCasedName.includes(lowerCasedInput) ||
        initials.includes(lowerCasedInput)
      );
    });

    return filtered.length > 0 ? filtered : null;
  }, [inputValue, schools]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSelect = (schoolId: string, schoolName: string) => {
    setSelectedValue(schoolName);
    setInputValue(schoolName);
    onSelect(schoolId, schoolName);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between", className)}
        >
          <span className="truncate max-w-full">
            {selectedValue || "Select school..."}
          </span>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search school..."
            className="h-9 text-gray-400"
            value={inputValue}
            onInput={handleInputChange}
          />
          <CommandList>
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <Spinner />
              </div>
            ) : filteredSchools ? (
              filteredSchools.map((school) => (
                <CommandItem
                  key={school.id}
                  value={school.name}
                  onSelect={() => handleSelect(school.id, school.name)}
                >
                  {school.name}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedValue === school.name
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))
            ) : (
              <div
                onClick={() => handleSelect("not-listed", "My school isn't listed")}
                style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#f3f4f6' }}
              >
                My school isn't listed
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SchoolsInput;
