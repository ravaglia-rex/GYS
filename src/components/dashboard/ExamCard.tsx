import React, { useRef, useState, useEffect } from "react";
import {
  Table, 
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
} from "../ui/table";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';
import { 
  Check, 
  // Lock, 
  AlertTriangle 
} from "lucide-react";
import { cn } from "../../lib/utils";
import StartExamButton from "./StartExamButton";
import { fetchResultTotals, fetchPhase1ResultTotals } from "../../db/examResponsesCollection";
import * as Sentry from '@sentry/react';

type ExamCardProps = React.ComponentProps<typeof Card> & {
  userID: string;
  formID: string;
  cardTitle: string;
  duration?: number;
  cardDescription: string;
  paymentNeeded: boolean;
  examDetails: string[];
  additionalInstructions: string[];
  isProctored: boolean;
  isEligible: boolean;
  eligibilityAt: string;
  hasCleared?: boolean | null;
  hasCompleted?: boolean;
  typeQuestions?: Record<string, number>;
};

type ResultTotals = {
  overallTotal: number;
  typeTotals: {
    [key: string]: number;
  };
};

const ExamCard: React.FC<ExamCardProps> = ({
  userID,
  formID,
  className,
  cardTitle,
  duration,
  cardDescription,
  examDetails,
  additionalInstructions,
  paymentNeeded,
  isProctored,
  isEligible,
  eligibilityAt,
  hasCleared,
  hasCompleted,
  typeQuestions,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [cardDimensions, setCardDimensions] = useState({ width: 0, height: 0 });
  const [resultTotals, setResultTotals] = useState<ResultTotals|null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number|null>(null);

  useEffect(() => {
    if (cardRef.current) {
      setCardDimensions({
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
      });
    }
  }, [cardRef]);

  useEffect(() => {
    const getResultTotals = async () => {
      if (hasCleared !== undefined && hasCleared !== null) {
        try {
          const results = await fetchResultTotals(userID, formID);
          if(results) {
            setResultTotals(results);
          } else if(formID==='npByEB'){
            const phase1results = await fetchPhase1ResultTotals(userID);
            if(phase1results) {
              setResultTotals(phase1results);
            }
          }
        } catch (e) {
          Sentry.withScope((scope) => {
            scope.setTag('location', 'ExamCard.getResultTotals');
            scope.setExtra('userID', userID);
            scope.setExtra('formID', formID);
            Sentry.captureException(e);
          });
        }
      }
    };

    getResultTotals();
  }, [hasCleared, formID, userID]);

  useEffect(() => {
    if (typeQuestions) {
      setTotalQuestions(Object.values(typeQuestions).reduce((sum, value) => sum + value, 0));
    }
  }, [typeQuestions]);

  const scrollToFooter = () => {
    if (footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const renderOverlay = () => {
    if (hasCleared !== undefined && hasCleared !== null) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`absolute flex flex-col items-center justify-center z-20 cursor-not-allowed ${hasCleared ? 'bg-green-800' : 'bg-yellow-800'} bg-opacity-75 text-white`}
                style={{ width: cardDimensions.width, height: cardDimensions.height }}
              >
                {hasCleared ? <Check className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                <div className="mt-2 text-center text-lg font-bold">
                  {hasCleared ? "Qualified" : "Not Qualified"}
                  {resultTotals && (
                    <Table>
                      <TableBody>
                        {Object.entries(resultTotals.typeTotals).map(([type, total]) => (
                          <TableRow key={type}>
                            <TableCell>{type}</TableCell>
                            <TableCell>
                              {typeQuestions && typeQuestions[type] 
                              ? (total*100 / typeQuestions[type]).toFixed(0)+'%' 
                              : total.toString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell>Total</TableCell>
                          <TableCell>
                            {totalQuestions ? (resultTotals.overallTotal*100 / totalQuestions).toFixed(0)+'%' : resultTotals.overallTotal}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-30">
              {hasCleared ? "You have qualified this exam" : "You have not qualified this exam"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (hasCompleted) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute flex items-center justify-center z-20 cursor-not-allowed bg-gray-800 bg-opacity-75 text-white"
                style={{ width: cardDimensions.width, height: cardDimensions.height }}
              >
                <Check className="h-8 w-8" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-30">
              You have completed this exam. Waiting for results.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return null;
  };

  return (
    <div className="relative w-full exam-card">
      <div ref={cardRef} className="relative rounded-2xl overflow-hidden">
        {renderOverlay()}
        <Card className={cn("relative rounded-2xl border-white/10 bg-gray-900/60 backdrop-blur-xl", !isEligible ? 'pointer-events-none' : '', className)} {...props}>
          {hasCompleted === false && (
            <div className="bg-emerald-700/20 text-emerald-300 p-2 text-sm rounded-t-2xl cursor-pointer hover:bg-emerald-700/30 flex items-center justify-center" onClick={scrollToFooter}>
              Please scroll down to the bottom to start the exam
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-white">{cardTitle}</CardTitle>
            <CardDescription className="text-gray-400">{cardDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-4">
              {examDetails.map((detailString, index) => {
                let detail;
                try {
                  detail = JSON.parse(detailString);
                } catch (e) {
                  return null;
                }
                return (
                  <div key={index} className="mb-4">
                    <p className="text-lg font-medium text-white">{detail.section}</p>
                    <p className="text-sm text-gray-300">Questions: {detail.questions}</p>
                    <p className="text-sm text-gray-400">{detail.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 space-y-4">
              {additionalInstructions.map((instruction, index) => (
                <React.Fragment key={index}>
                  <p className="text-sm text-gray-400">
                    {instruction}
                  </p>
                  {index < additionalInstructions.length - 1 && (
                    <hr className="border-t border-white/10" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
          <CardFooter ref={footerRef}>
            {hasCleared === undefined && <StartExamButton formId={formID} paymentNeeded={paymentNeeded} isProctored={isProctored} />}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ExamCard;
