import * as React from "react";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import 'flag-icons/css/flag-icons.min.css';
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { LoadingSpinner as Spinner } from "../ui/spinner"; // Import Spinner

// Register the countries data
countries.registerLocale(en);

interface Country {
  value: string;
  label: string;
  iso3: string;
}

interface CountrySelectorProps {
    onSelect: (country: string) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({onSelect}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [selectedCountry, setSelectedCountry] = React.useState<Country | null>(null);
  const [countryList, setCountryList] = React.useState<Country[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCountryNames = () => {
      try {
        const countryNames = countries.getNames("en", { select: "official" });
        if (countryNames) {
          const list = Object.entries(countryNames).map(([iso2, name]) => ({
            value: iso2,
            label: name,
            iso3: countries.alpha2ToAlpha3(iso2) || "N/A",
          }));
          setCountryList(list);
        }
      } catch (error) {
        console.error("Error fetching country names:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountryNames();
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    setInputValue(country.label);
    onSelect(country.iso3);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedCountry ? (
            <>
              <span className={`fi fi-${selectedCountry.value.toLowerCase()} mr-2`} />
              <span className="truncate max-w-full">{selectedCountry.label}</span>
            </>
          ) : (
            "Select country..."
          )}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search country..."
            value={inputValue}
            onInput={handleInputChange}
          />
          <CommandList>
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <Spinner />
              </div>
            ) : (
              countryList.filter(country => country.label.toLowerCase().includes(inputValue.toLowerCase())).map(country => (
                <CommandItem
                  key={country.value}
                  onSelect={() => handleSelect(country)}
                >
                  <span className={`fi fi-${country.value.toLowerCase()} mr-2`} />
                  {country.label}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedCountry?.value === country.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))
            )}
            <CommandEmpty>No country found.</CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CountrySelector;
