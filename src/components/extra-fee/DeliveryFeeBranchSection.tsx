"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatAddedOn, formatLkr, MAX_FEES_PER_BRANCH } from "@/domains/extra-fee/mockData";
import type { DeliveryFeeItem } from "@/domains/extra-fee/types";

type Props = {
  branchName: string;
  branchLocation: string;
  fees: DeliveryFeeItem[];
  onEdit: (fee: DeliveryFeeItem) => void;
  onDelete: (fee: DeliveryFeeItem) => void;
};

function DeliveryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 18V6C14 5.46957 13.7893 4.96086 13.4142 4.58579C13.0391 4.21071 12.5304 4 12 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V17C2 17.2652 2.10536 17.5196 2.29289 17.7071C2.48043 17.8946 2.73478 18 3 18H5"
        stroke="#155DFC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 18H9"
        stroke="#155DFC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 18H21C21.2652 18 21.5196 17.8946 21.7071 17.7071C21.8946 17.5196 22 17.2652 22 17V13.35C21.9996 13.1231 21.922 12.903 21.78 12.726L18.3 8.376C18.2065 8.25888 18.0878 8.16428 17.9528 8.0992C17.8178 8.03412 17.6699 8.00021 17.52 8H14"
        stroke="#155DFC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 20C18.1046 20 19 19.1046 19 18C19 16.8954 18.1046 16 17 16C15.8954 16 15 16.8954 15 18C15 19.1046 15.8954 20 17 20Z"
        stroke="#155DFC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 20C8.10457 20 9 19.1046 9 18C9 16.8954 8.10457 16 7 16C5.89543 16 5 16.8954 5 18C5 19.1046 5.89543 20 7 20Z"
        stroke="#155DFC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 18.3327V3.33268C5 2.89065 5.17559 2.46673 5.48816 2.15417C5.80072 1.84161 6.22464 1.66602 6.66667 1.66602H13.3333C13.7754 1.66602 14.1993 1.84161 14.5118 2.15417C14.8244 2.46673 15 2.89065 15 3.33268V18.3327H5Z"
        stroke="#45556C"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.99984 10H3.33317C2.89114 10 2.46722 10.1756 2.15466 10.4882C1.8421 10.8007 1.6665 11.2246 1.6665 11.6667V16.6667C1.6665 17.1087 1.8421 17.5326 2.15466 17.8452C2.46722 18.1577 2.89114 18.3333 3.33317 18.3333H4.99984"
        stroke="#45556C"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 7.5H16.6667C17.1087 7.5 17.5326 7.6756 17.8452 7.98816C18.1577 8.30072 18.3333 8.72464 18.3333 9.16667V16.6667C18.3333 17.1087 18.1577 17.5326 17.8452 17.8452C17.5326 18.1577 17.1087 18.3333 16.6667 18.3333H15"
        stroke="#45556C"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.3335 5H11.6668"
        stroke="#45556C"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.3335 8.33398H11.6668"
        stroke="#45556C"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.3335 11.666H11.6668"
        stroke="#45556C"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.3335 15H11.6668"
        stroke="#45556C"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DeliveryFeeBranchSection({
  branchName,
  branchLocation,
  fees,
  onEdit,
  onDelete,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#FFFFFF1A] bg-[#FFFFFF1A] shadow-[0px_-1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
      <div className="flex items-start justify-between px-4 py-4 sm:px-5">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center">
            <BranchIcon />
          </div>
          <div>
            <h3 className="font-['Inter'] text-[18px] font-bold leading-[27px] tracking-[0px] text-[#1D293D]">
              {branchName}
            </h3>
            <p className="font-['Inter'] text-xs font-normal leading-4 tracking-[0px] text-[#62748E]">
              {branchLocation}
            </p>
          </div>
        </div>
        <span className="font-['Inter'] text-xs font-bold leading-4 tracking-[0px] text-[#62748E]">
          {fees.length}/{MAX_FEES_PER_BRANCH} fees
        </span>
      </div>
      <div className="border-t border-[#F1F5F9] pl-2">
        {fees.map((fee) => (
          <div
            key={fee.id}
            className="flex flex-col gap-3 border-b border-[#F1F5F9] px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div className="flex items-stretch gap-2.5">
              <div className="flex w-11 shrink-0 items-center justify-center self-stretch rounded-[10px] bg-[#EFF6FF]">
                <DeliveryIcon />
              </div>
              <div>
                <p className="font-['Inter'] text-base font-bold leading-6 tracking-[0px] text-[#1D293D]">
                  {fee.zoneName}
                </p>
                <p className="font-['Inter'] text-sm font-normal leading-5 tracking-[0px] text-[#62748E]">
                  {formatAddedOn(fee.addedOn)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end sm:gap-6">
              <p className="text-right font-['Inter'] text-2xl font-bold leading-8 tracking-[0px] text-[#EA580C]">
                {formatLkr(fee.price)}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(fee)}
                  className="rounded-lg p-2 text-[#3B82F6] transition-colors hover:bg-[#EFF6FF]"
                  aria-label={`Edit ${fee.zoneName}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(fee)}
                  className="rounded-lg p-2 text-[#FB2C36] transition-colors hover:bg-[#FEF2F2]"
                  aria-label={`Delete ${fee.zoneName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
