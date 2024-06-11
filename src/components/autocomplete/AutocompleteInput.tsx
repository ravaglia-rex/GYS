import * as React from "react"
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"

interface School {
  id: string
  name: string
}

interface AutocompleteInputProps {
  schools: School[]
  onSelect: (schoolId: string, schoolName?: string) => void
  className?: string
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ schools, onSelect, className }) => {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [selectedValue, setSelectedValue] = React.useState("")

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  const handleSelect = (schoolId: string, schoolName: string) => {
    setSelectedValue(schoolName)
    setInputValue(schoolName)
    onSelect(schoolName, schoolName)
    setOpen(false)
  }

  const handleCustomInputSelect = () => {
    handleSelect(inputValue, inputValue)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between", className)}
        >
          {selectedValue || "Select school..."}
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
            {schools.filter(school => school.name.toLowerCase().includes(inputValue.toLowerCase())).map(school => (
              <CommandItem
                key={school.name}
                value={school.name}
                onSelect={() => handleSelect(school.id, school.name)}
              >
                {school.name}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    selectedValue === school.name ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
            {inputValue && !schools.some(school => school.name.toLowerCase() === inputValue.toLowerCase()) && (
              <CommandItem
                onSelect={handleCustomInputSelect}
              >
                Add "{inputValue}"
              </CommandItem>
            )}
            <CommandEmpty>No school found.</CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default AutocompleteInput;
