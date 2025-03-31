import React, { useMemo, useState } from "react";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Command, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { LoadingSpinner as Spinner } from "../ui/spinner";
import Fuse from "fuse.js";

interface Payee {
  id: string;
  name: string;
}

interface PayeeInputProps {
  payees: Payee[];
  onSelect: (payeeId: string, payeeName?: string) => void;
  className?: string;
  loading?: boolean;
}

const PayeesInput: React.FC<PayeeInputProps> = ({
  payees = [],
  onSelect,
  className = "",
  loading = false,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] = useState("");

  // Fuse.js instance for search
  const fuse = useMemo(() => {
    return new Fuse(payees, {
      keys: ["name"],
      includeScore: true,
      threshold: 0.3,
    });
  }, [payees]);

  // Filtered payees based on input value
  const filteredPayees = useMemo(() => {
    if (!inputValue.trim()) return payees;
    return fuse.search(inputValue).map((result) => result.item);
  }, [inputValue, payees, fuse]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSelect = (payeeId: string, payeeName: string) => {
    setSelectedValue(payeeName);
    setInputValue(payeeName);
    onSelect(payeeId, payeeName);
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
            {selectedValue || "Select payer..."}
          </span>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search payee..."
            className="h-9 text-gray-400"
            value={inputValue}
            onInput={handleInputChange}
          />
          <CommandList>
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <Spinner />
              </div>
            ) : (
              <>
                {filteredPayees.map((payee) => (
                  <CommandItem
                    key={payee.id}
                    value={payee.name}
                    onSelect={() => handleSelect(payee.id, payee.name)}
                  >
                    {payee.name}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedValue === payee.name
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
                <CommandItem
                  onSelect={() => handleSelect("new", "Add Payer")}
                  className="cursor-pointer text-sm bg-gray-50 hover:bg-gray-100"
                >
                  Add Payer
                </CommandItem>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default PayeesInput;
