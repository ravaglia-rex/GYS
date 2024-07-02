import React, { useEffect, useState } from "react";
import { createExpeditedSchool, fetchSchoolNamesAndIds } from "../../db/schoolCollection";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import WaitlistDialog from "./WaitlistDialog";
import CongratulationsDialog from "./CongratulationsDialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "../ui/form";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import AutocompleteInput from "../autocomplete/AutocompleteInput";
import { useStepper } from "../ui/stepper";

const schoolSchema = z.object({
  school: z.string().min(1, "School is required"),
  grade: z.number().int().min(1, "Grade is required"),
});

interface SchoolInfoFormProps {
  isQualified: boolean | null;
  setSchool: (school: string) => void;
  setGrade: (grade: number) => void;
}

const SchoolInfoForm: React.FC<SchoolInfoFormProps> = ({ setSchool, setGrade, isQualified }) => {
  const [schoolsList, setSchoolsList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const { toast } = useToast();
  const { nextStep, prevStep } = useStepper();
  const [showDialog, setShowDialog] = useState(true);

  const form = useForm({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      school: "",
      grade: 0,
    },
  });

  useEffect(() => {
    const fetchSchoolsData = async () => {
      try {
        const schoolsData = await fetchSchoolNamesAndIds();
        if (schoolsData) {
          setSchoolsList(schoolsData);
        }
      } catch (error: any) {
        return null;
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchSchoolsData();
  }, []);

  const onSubmit = async (data: z.infer<typeof schoolSchema>) => {
    try {
      // Step 1: Find the school record
      let schoolId = data.school;

      const matchedSchool = schoolsList.find((school) => school.name === data.school);
      if (matchedSchool) {
        schoolId = matchedSchool.id;
      } else {
        // Create a new school and assign the returned ID
        schoolId = await createExpeditedSchool({ school_name: data.school });
      }
      setSchool(schoolId);
      setGrade(data.grade);
      nextStep();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error?.message || "An error occurred while signing up. Please try again.",
      });
    }
  };

  return (
    <div>
      {showDialog && isQualified === false && (
        <WaitlistDialog isOpen={showDialog} onClose={() => setShowDialog(false)} />
      )}
      {showDialog && isQualified === true && (
        <CongratulationsDialog isOpen={showDialog} onClose={() => setShowDialog(false)} />
      )}
      <h2 className="text-2xl font-semibold text-center mb-6">School 🏫</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="school"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School</FormLabel>
                <FormControl>
                  <AutocompleteInput 
                    schools={schoolsList} 
                    onSelect={(selectedSchoolId) => field.onChange(selectedSchoolId)}
                    className="bg-transparent rounded-lg w-full"
                    loading={loading} // Pass loading prop to AutocompleteInput
                  />
                </FormControl>
                <FormDescription className="text-xs">Take me from darkness to light</FormDescription>
                <FormMessage>{form.formState.errors.school?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grade</FormLabel>
                <FormControl>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6th Grade</SelectItem>
                      <SelectItem value="7">7th Grade</SelectItem>
                      <SelectItem value="8">8th Grade</SelectItem>
                      <SelectItem value="9">9th Grade</SelectItem>
                      <SelectItem value="10">10th Grade</SelectItem>
                      <SelectItem value="11">11th Grade</SelectItem>
                      <SelectItem value="12">12th Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage>{form.formState.errors.grade?.message}</FormMessage>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Next</Button>
          <Button type="button" onClick={() => prevStep()} className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">Previous</Button>
        </form>
      </Form>
    </div>
  );
};

export default SchoolInfoForm;
