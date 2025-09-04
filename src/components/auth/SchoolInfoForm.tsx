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
import SchoolsInput from "../autocomplete/SchoolsInput"; // Import SchoolsInput
import { useStepper } from "../ui/stepper";

import * as Sentry from "@sentry/react";
import analytics from "../../segment/segment";

const schoolSchema = z.object({
  school: z.string().min(1, "School is required"),
  grade: z.number().int().min(1, "Grade is required"),
});

interface SchoolInfoFormProps {
  email: string;
  isQualified: boolean | null;
  setSchool: (school: string) => void;
  setGrade: (grade: number) => void;
}

const SchoolInfoForm: React.FC<SchoolInfoFormProps> = ({ email, setSchool, setGrade, isQualified }) => {
  const [schoolsList, setSchoolsList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true); 
  const [isCustomSchool, setIsCustomSchool] = useState(false); 
  const [customSchoolName, setCustomSchoolName] = useState("");
  const [customSchoolCity, setCustomSchoolCity] = useState("");
  const [customSchoolState, setCustomSchoolState] = useState("");
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
      const startTime = performance.now();
      try {
        const schoolsData = await fetchSchoolNamesAndIds();
        if (schoolsData) {
          setSchoolsList(schoolsData);
        }
      } catch (error: any) {
        Sentry.withScope((scope) => {
          scope.setTag("location", "SchoolInfoForm.fetchSchoolsData");
          Sentry.captureException(error);
        });
        return null;
      } finally {
        setLoading(false);
        const endTime = performance.now();
        const fetchTime = endTime - startTime;
        analytics.track('[TIME] Schools Fetch', {
          fetchTime: fetchTime,
          email: email,
          url: window.location.href
        });
      }
    };

    fetchSchoolsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: z.infer<typeof schoolSchema>) => {
    try {
      let schoolId = data.school;

      if (isCustomSchool) {
        schoolId = await createExpeditedSchool({ 
          school_name: customSchoolName,
          city: customSchoolCity,
          state: customSchoolState
        });
        
        analytics.track("[CREATE] New School Added", {
          email: email,
          school_name: customSchoolName,
        });

        Sentry.withScope((scope) => {
          scope.setTag("location", "SchoolInfoForm.createExpeditedSchool");
          scope.setExtra("school_name", customSchoolName);
          Sentry.captureMessage("New school created");
        });
      } else {
        const matchedSchool = schoolsList.find((school) => school.id === data.school);
        if (matchedSchool) {
          schoolId = matchedSchool.id;
        }
      }

      setSchool(schoolId);
      setGrade(data.grade);
      nextStep();
    } catch (error: any) {
      Sentry.withScope((scope) => {
        scope.setTag("location", "SchoolInfoForm.onSubmit");
        scope.setExtra("school", data.school);
        scope.setExtra("grade", data.grade);
        Sentry.captureException(error);
      });
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
        <h2 className="text-2xl font-semibold text-center mb-6 text-white mt-8">School 🏫</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-300">School</FormLabel>
                  <FormControl>
                    <SchoolsInput 
                      schools={schoolsList} 
                      onSelect={(selectedSchoolId, selectedSchoolName) => {
                        field.onChange(selectedSchoolId);
                        if (selectedSchoolId === "not-listed") {
                          setIsCustomSchool(true);
                        } else {
                          setIsCustomSchool(false);
                          setCustomSchoolName("");
                        }
                      }}
                      className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 rounded-lg w-full text-white"
                      loading={loading}
                    />
                  </FormControl>
                  {isCustomSchool && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <FormLabel className="text-sm text-gray-300">Enter your school name</FormLabel>
                        <input 
                          type="text" 
                          value={customSchoolName} 
                          onChange={(e) => setCustomSchoolName(e.target.value)}
                          className="bg-gray-900/60 border border-white/10 focus:ring-purple-600 focus:border-purple-600 rounded-lg p-2 w-full text-white placeholder:text-gray-500"
                          placeholder="School name"
                        />
                      </div>
                      <div>
                        <FormLabel className="text-sm text-gray-300">Enter your school city</FormLabel>
                        <input 
                          type="text" 
                          value={customSchoolCity} 
                          onChange={(e) => setCustomSchoolCity(e.target.value)}
                          className="bg-gray-900/60 border border-white/10 focus:ring-purple-600 focus:border-purple-600 rounded-lg p-2 w-full text-white placeholder:text-gray-500"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <FormLabel className="text-sm text-gray-300">Enter your school state</FormLabel>
                        <input 
                          type="text" 
                          value={customSchoolState} 
                          onChange={(e) => setCustomSchoolState(e.target.value)}
                          className="bg-gray-900/60 border border-white/10 focus:ring-purple-600 focus:border-purple-600 rounded-lg p-2 w-full text-white placeholder:text-gray-500"
                          placeholder="State"
                        />
                      </div>
                    </div>
                  )}
                  <FormDescription className="text-xs text-gray-500">Take me from darkness to light</FormDescription>
                  <FormMessage className="text-red-400">{form.formState.errors.school?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-300">Grade</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value.toString()}
                    >
                      <SelectTrigger className="bg-gray-900/60 border-white/10 focus:ring-purple-600 text-white">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10">
                        <SelectItem value="6" className="text-white hover:bg-purple-600/20">6th Grade</SelectItem>
                        <SelectItem value="7" className="text-white hover:bg-purple-600/20">7th Grade</SelectItem>
                        <SelectItem value="8" className="text-white hover:bg-purple-600/20">8th Grade</SelectItem>
                        <SelectItem value="9" className="text-white hover:bg-purple-600/20">9th Grade</SelectItem>
                        <SelectItem value="10" className="text-white hover:bg-purple-600/20">10th Grade</SelectItem>
                        <SelectItem value="11" className="text-white hover:bg-purple-600/20">11th Grade</SelectItem>
                        <SelectItem value="12" className="text-white hover:bg-purple-600/20">12th Grade</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="text-red-400">{form.formState.errors.grade?.message}</FormMessage>
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              Next
            </Button>
            <Button 
              type="button" 
              onClick={() => prevStep()} 
              className="w-full py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 border border-gray-600/30 rounded-md font-semibold transition-all duration-300"
            >
              Previous
            </Button>
          </form>
        </Form>
      </div>
  );
};

export default SchoolInfoForm;
