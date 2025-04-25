/** @format */
"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Check, X, Trash } from "lucide-react";

function formatCurrency(amount: number): string {
  return `₱${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatDateString(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

type Transaction = {
  periodId: string;
  amount: number;
};

type Loan = {
  id: string;
  name: string;
  total: number;
  payments: Transaction[];
};

type Saving = {
  id: string;
  name: string;
  total: number;
  deposits: Transaction[];
};

type Deduction = {
  id: string;
  name: string;
  amount: number;
  type: "expense" | "loan" | "saving";
  paid: boolean;
  loanId?: string;
  savingId?: string;
};

type DateRange = {
  from: string;
  to?: string;
};

type Period = {
  id: string;
  salary: string;
  deductions: Deduction[];
  createdAt: Date;
  isEditable: boolean;
  dateRange?: DateRange;
};

type EditTransactionData = {
  name: string;
  total: number;
};

const SalaryTracker: React.FC = () => {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);
  const [newDeductionName, setNewDeductionName] = useState<string>("");
  const [newDeductionAmount, setNewDeductionAmount] = useState<string>("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [deductionHistory, setDeductionHistory] = useState<string[]>([]);
  const [loanHistory, setLoanHistory] = useState<string[]>([]);
  const [savingHistory, setSavingHistory] = useState<string[]>([]);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [editingSavingId, setEditingSavingId] = useState<string | null>(null);
  const [editLoanData, setEditLoanData] = useState<EditTransactionData>({
    name: "",
    total: 0,
  });
  const [editSavingData, setEditSavingData] = useState<EditTransactionData>({
    name: "",
    total: 0,
  });
  const [error, setError] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const allDeductionOptions = [
    ...Array.from(
      new Set([
        ...deductionHistory,
        ...loans.map((loan) => loan.name),
        ...savings.map((saving) => saving.name),
      ])
    ),
  ];

  useEffect(() => {
    const savedData = JSON.parse(
      localStorage.getItem("salaryTrackerData") || "{}"
    );

    if (savedData.periods?.length > 0) {
      const parsedPeriods = savedData.periods.map((period: any) => ({
        ...period,
        createdAt: new Date(period.createdAt),
        deductions: period.deductions.map((d: any) => ({
          ...d,
          date: d.date ? new Date(d.date) : new Date(),
        })),
      }));
      setPeriods(parsedPeriods);
      setCurrentPeriodId(parsedPeriods[0].id);
      if (parsedPeriods[0].dateRange) {
        setStartDate(parsedPeriods[0].dateRange.from || "");
        setEndDate(parsedPeriods[0].dateRange.to || "");
      }
    } else {
      const defaultPeriod: Period = {
        id: Date.now().toString(),
        salary: "",
        deductions: [],
        createdAt: new Date(),
        isEditable: true,
        dateRange: {
          from: "",
          to: "",
        },
      };
      setPeriods([defaultPeriod]);
      setCurrentPeriodId(defaultPeriod.id);
    }

    if (savedData.loans) {
      const parsedLoans = savedData.loans.map((loan: any) => ({
        ...loan,
        payments: loan.payments || [],
      }));
      setLoans(parsedLoans);
    }

    if (savedData.savings) {
      const parsedSavings = savedData.savings.map((saving: any) => ({
        ...saving,
        deposits: saving.deposits || [],
      }));
      setSavings(parsedSavings);
    }

    if (savedData.deductionHistory)
      setDeductionHistory(savedData.deductionHistory);
    if (savedData.loanHistory) setLoanHistory(savedData.loanHistory);
    if (savedData.savingHistory) setSavingHistory(savedData.savingHistory);
  }, []);

  useEffect(() => {
    const dataToSave = {
      periods,
      loans,
      savings,
      deductionHistory,
      loanHistory,
      savingHistory,
    };
    localStorage.setItem("salaryTrackerData", JSON.stringify(dataToSave));
  }, [periods, loans, savings, deductionHistory, loanHistory, savingHistory]);

  const currentPeriod: Period = periods.find(
    (p) => p.id === currentPeriodId
  ) || {
    id: "",
    salary: "",
    deductions: [],
    createdAt: new Date(),
    isEditable: true,
  };

  const createNewPeriod = (): void => {
    const newPeriod: Period = {
      id: Date.now().toString(),
      salary: "",
      deductions: [],
      createdAt: new Date(),
      isEditable: true,
      dateRange: {
        from: "",
        to: "",
      },
    };
    setPeriods([...periods, newPeriod]);
    setCurrentPeriodId(newPeriod.id);
    setStartDate("");
    setEndDate("");
  };

  const savePeriod = (): void => {
    if (!currentPeriodId) return;

    if (!currentPeriod.salary || !startDate) {
      setError("Salary amount and start date are required");
      return;
    }

    setError("");
    setPeriods(
      periods.map((p) =>
        p.id === currentPeriodId
          ? {
              ...p,
              isEditable: false,
              dateRange: {
                from: startDate,
                to: endDate,
              },
            }
          : p
      )
    );
  };

  const editPeriod = (): void => {
    if (!currentPeriodId) return;
    setPeriods(
      periods.map((p) =>
        p.id === currentPeriodId ? { ...p, isEditable: true } : p
      )
    );
  };

  const addDeduction = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!newDeductionName || !newDeductionAmount) return;

    const amount = parseFloat(newDeductionAmount);
    const isLoan = loans.some((loan) => loan.name === newDeductionName);
    const isSaving = savings.some((saving) => saving.name === newDeductionName);
    const loan = loans.find((loan) => loan.name === newDeductionName);
    const saving = savings.find((saving) => saving.name === newDeductionName);

    const newDeduction: Deduction = {
      id: Date.now().toString(),
      name: newDeductionName,
      amount,
      type: isLoan ? "loan" : isSaving ? "saving" : "expense",
      paid: false,
      loanId: loan?.id,
      savingId: saving?.id,
    };

    setPeriods(
      periods.map((p) =>
        p.id === currentPeriodId
          ? { ...p, deductions: [...p.deductions, newDeduction] }
          : p
      )
    );

    if (
      !deductionHistory.includes(newDeductionName) &&
      newDeductionName.trim() !== ""
    ) {
      setDeductionHistory([...deductionHistory, newDeductionName]);
    }

    setNewDeductionName("");
    setNewDeductionAmount("");
  };

  const togglePaidStatus = (id: string): void => {
    setPeriods((prevPeriods) => {
      return prevPeriods.map((p) => {
        if (p.id !== currentPeriodId) return p;

        const updatedDeductions = p.deductions.map((d) => {
          if (d.id !== id) return d;

          if (d.type === "loan") {
            const loanToUpdate = loans.find((loan) => loan.id === d.loanId);
            if (loanToUpdate) {
              if (d.paid) {
                // Remove payment from loan
                setLoans((prevLoans) =>
                  prevLoans.map((loan) =>
                    loan.id === loanToUpdate.id
                      ? {
                          ...loan,
                          payments: loan.payments.filter(
                            (p) =>
                              !(
                                p.periodId === currentPeriodId &&
                                p.amount === d.amount
                              )
                          ),
                        }
                      : loan
                  )
                );
              } else {
                // Add payment to loan
                setLoans((prevLoans) =>
                  prevLoans.map((loan) =>
                    loan.id === loanToUpdate.id
                      ? {
                          ...loan,
                          payments: loan.payments.some(
                            (p) =>
                              p.periodId === currentPeriodId &&
                              p.amount === d.amount
                          )
                            ? loan.payments
                            : [
                                ...loan.payments,
                                { periodId: currentPeriodId, amount: d.amount },
                              ],
                        }
                      : loan
                  )
                );
              }
            }
          } else if (d.type === "saving") {
            const savingToUpdate = savings.find(
              (saving) => saving.id === d.savingId
            );
            if (savingToUpdate) {
              if (d.paid) {
                // Remove deposit from saving
                setSavings((prevSavings) =>
                  prevSavings.map((saving) =>
                    saving.id === savingToUpdate.id
                      ? {
                          ...saving,
                          deposits: saving.deposits.filter(
                            (p) =>
                              !(
                                p.periodId === currentPeriodId &&
                                p.amount === d.amount
                              )
                          ),
                        }
                      : saving
                  )
                );
              } else {
                // Add deposit to saving
                setSavings((prevSavings) =>
                  prevSavings.map((saving) =>
                    saving.id === savingToUpdate.id
                      ? {
                          ...saving,
                          deposits: saving.deposits.some(
                            (p) =>
                              p.periodId === currentPeriodId &&
                              p.amount === d.amount
                          )
                            ? saving.deposits
                            : [
                                ...saving.deposits,
                                { periodId: currentPeriodId, amount: d.amount },
                              ],
                        }
                      : saving
                  )
                );
              }
            }
          }

          return { ...d, paid: !d.paid };
        });

        return { ...p, deductions: updatedDeductions };
      });
    });
  };

  const getTransactionTotal = (
    transactions: Transaction[],
    periodId?: string
  ): number => {
    if (periodId) {
      return transactions
        .filter((t) => t.periodId === periodId)
        .reduce((sum, t) => sum + t.amount, 0);
    }
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const startEditingLoan = (loan: Loan): void => {
    setEditingLoanId(loan.id);
    setEditLoanData({
      name: loan.name,
      total: loan.total,
    });
  };

  const startEditingSaving = (saving: Saving): void => {
    setEditingSavingId(saving.id);
    setEditSavingData({
      name: saving.name,
      total: saving.total,
    });
  };

  const cancelEditing = (): void => {
    setEditingLoanId(null);
    setEditingSavingId(null);
    setEditLoanData({ name: "", total: 0 });
    setEditSavingData({ name: "", total: 0 });
  };

  const saveLoanEdit = (): void => {
    setLoans(
      loans.map((loan) =>
        loan.id === editingLoanId
          ? {
              ...loan,
              name: editLoanData.name,
              total: editLoanData.total,
            }
          : loan
      )
    );
    setEditingLoanId(null);
  };

  const saveSavingEdit = (): void => {
    setSavings(
      savings.map((saving) =>
        saving.id === editingSavingId
          ? {
              ...saving,
              name: editSavingData.name,
              total: editSavingData.total,
            }
          : saving
      )
    );
    setEditingSavingId(null);
  };

  const deleteLoan = (id: string): void => {
    setLoans(loans.filter((loan) => loan.id !== id));
    setPeriods(
      periods.map((p) => ({
        ...p,
        deductions: p.deductions.filter((d) => d.loanId !== id),
      }))
    );
  };

  const deleteSaving = (id: string): void => {
    setSavings(savings.filter((saving) => saving.id !== id));
    setPeriods(
      periods.map((p) => ({
        ...p,
        deductions: p.deductions.filter((d) => d.savingId !== id),
      }))
    );
  };

  const totalDeductions: number = currentPeriod.deductions.reduce(
    (sum, d) => sum + d.amount,
    0
  );
  const totalPaid: number = currentPeriod.deductions
    .filter((d) => d.paid)
    .reduce((sum, d) => sum + d.amount, 0);
  const netSalary: number =
    parseFloat(currentPeriod.salary || "0") - totalDeductions;

  const totalSavings = savings.reduce(
    (sum, saving) => sum + getTransactionTotal(saving.deposits),
    0
  );

  return (
    <div className="mx-auto p-4 space-y-6 max-w-6xl">
      <style jsx>{`
        button:focus {
          outline: none;
          border: none;
        }
      `}</style>

      <h1 className="text-3xl font-bold text-center">Salary Tracker</h1>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="relative w-full sm:w-64">
          <button
            className="w-full h-10 px-3 py-2 text-sm border rounded-md shadow-sm bg-white text-left flex items-center justify-between focus:outline-none focus:ring focus:ring-gray-500"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>
              {currentPeriodId
                ? periods.find((p) => p.id === currentPeriodId)?.dateRange?.from
                  ? `${formatDateString(
                      periods.find((p) => p.id === currentPeriodId)?.dateRange
                        ?.from || ""
                    )} - ${formatDateString(
                      periods.find((p) => p.id === currentPeriodId)?.dateRange
                        ?.to || ""
                    )}`
                  : "New period"
                : "Select a period"}
            </span>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {periods.map((period) => (
                <button
                  key={period.id}
                  onClick={() => {
                    setCurrentPeriodId(period.id);
                    setDropdownOpen(false);
                    if (period.dateRange) {
                      setStartDate(period.dateRange.from || "");
                      setEndDate(period.dateRange.to || "");
                    } else {
                      setStartDate("");
                      setEndDate("");
                    }
                  }}
                  className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-300"
                >
                  {period.dateRange?.from
                    ? `${formatDateString(
                        period.dateRange.from
                      )} - ${formatDateString(period.dateRange.to || "")}`
                    : "New period"}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={createNewPeriod}
          className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:border-none"
        >
          + New Period
        </button>
      </div>

      <div className="p-4 border rounded-lg bg-white">
        <h3 className="text-xl font-semibold mb-4">Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Gross Salary:</span>
            <span className="font-medium">
              {formatCurrency(parseFloat(currentPeriod.salary || "0"))}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Deductions:</span>
            <span className="font-medium text-red-600">
              -{formatCurrency(totalDeductions)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Paid Deductions:</span>
            <span className="font-medium text-green-600">
              {formatCurrency(totalPaid)}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Net Salary:</span>
            <span
              className={netSalary >= 0 ? "text-green-600" : "text-red-600"}
            >
              {formatCurrency(netSalary)}
            </span>
          </div>
        </div>
      </div>

      {currentPeriodId && (
        <>
          <div className="p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Salary Information</h3>
              {currentPeriod.isEditable ? (
                <button
                  onClick={savePeriod}
                  className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-700 transition-colors focus:outline-none focus:border-none"
                  title="Save Period"
                >
                  <Check className="h-5 w-5 text-white" />
                </button>
              ) : (
                <button
                  onClick={editPeriod}
                  className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors focus:outline-none focus:border-none"
                  title="Edit Period"
                >
                  <Edit className="h-5 w-5 text-gray-600" />
                </button>
              )}
            </div>
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Salary Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    ₱
                  </span>
                  <input
                    type={currentPeriod.isEditable ? "number" : "text"}
                    value={
                      currentPeriod.isEditable
                        ? currentPeriod.salary
                        : formatCurrency(
                            parseFloat(currentPeriod.salary || "0")
                          )
                    }
                    onChange={(e) => {
                      setPeriods(
                        periods.map((p) =>
                          p.id === currentPeriodId
                            ? { ...p, salary: e.target.value }
                            : p
                        )
                      );
                      setError("");
                    }}
                    placeholder="0.00"
                    className="pl-8 w-full h-10 px-3 py-2 border rounded-md"
                    disabled={!currentPeriod.isEditable}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setError("");
                    }}
                    className="h-10 px-3 py-2 border rounded-md"
                    disabled={!currentPeriod.isEditable}
                    required
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="h-10 px-3 py-2 border rounded-md"
                    disabled={!currentPeriod.isEditable}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Savings</h3>
              <button
                onClick={() => {
                  const newSaving: Saving = {
                    id: Date.now().toString(),
                    name: "New Saving",
                    total: 0,
                    deposits: [],
                  };
                  setSavings([...savings, newSaving]);
                  setEditingSavingId(newSaving.id);
                }}
                disabled={!currentPeriod.isEditable}
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors focus:outline-none focus:border-none"
              >
                <Plus className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {savings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No savings yet
                      </td>
                    </tr>
                  ) : (
                    savings.map((saving) => {
                      const totalSaved = getTransactionTotal(saving.deposits);
                      const savedThisPeriod = getTransactionTotal(
                        saving.deposits,
                        currentPeriodId
                      );

                      return (
                        <tr key={saving.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingSavingId === saving.id ? (
                              <input
                                type="text"
                                value={editSavingData.name}
                                onChange={(e) =>
                                  setEditSavingData({
                                    ...editSavingData,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full h-8 px-2 border rounded"
                                placeholder="Saving name"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-900">
                                {saving.name}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(totalSaved)}
                              {savedThisPeriod > 0 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({formatCurrency(savedThisPeriod)} this
                                  period)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {editingSavingId === saving.id ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={saveSavingEdit}
                                  className="text-green-600 hover:text-green-800 focus:outline-none focus:border-none"
                                >
                                  <Check className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="text-red-600 hover:text-red-800 focus:outline-none focus:border-none"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  disabled={!currentPeriod.isEditable}
                                  onClick={() => startEditingSaving(saving)}
                                  className="text-blue-600 hover:text-blue-800 focus:outline-none focus:border-none"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button
                                  disabled={!currentPeriod.isEditable}
                                  onClick={() => deleteSaving(saving.id)}
                                  className="text-red-600 hover:text-red-800 focus:outline-none focus:border-none"
                                >
                                  <Trash className="h-5 w-5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Loans</h3>
              <button
                onClick={() => {
                  const newLoan: Loan = {
                    id: Date.now().toString(),
                    name: "New Loan",
                    total: 0,
                    payments: [],
                  };
                  setLoans([...loans, newLoan]);
                  setEditingLoanId(newLoan.id);
                }}
                disabled={!currentPeriod.isEditable}
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors focus:outline-none focus:border-none"
              >
                <Plus className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Loan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remaining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No loans yet
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => {
                      const totalPaid = getTransactionTotal(loan.payments);
                      const paidThisPeriod = getTransactionTotal(
                        loan.payments,
                        currentPeriodId
                      );
                      const remaining = loan.total - totalPaid;

                      return (
                        <tr key={loan.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingLoanId === loan.id ? (
                              <input
                                type="text"
                                value={editLoanData.name}
                                onChange={(e) =>
                                  setEditLoanData({
                                    ...editLoanData,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full h-8 px-2 border rounded"
                                placeholder="Loan name"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-900">
                                {loan.name}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingLoanId === loan.id ? (
                              <input
                                type="number"
                                value={editLoanData.total || ""}
                                onChange={(e) =>
                                  setEditLoanData({
                                    ...editLoanData,
                                    total: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-full h-8 px-2 border rounded"
                                placeholder="0.00"
                              />
                            ) : (
                              <div className="text-sm text-gray-900">
                                {formatCurrency(loan.total)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(totalPaid)}
                              {paidThisPeriod > 0 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({formatCurrency(paidThisPeriod)} this period)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(remaining)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {editingLoanId === loan.id ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={saveLoanEdit}
                                  className="text-green-600 hover:text-green-800 focus:outline-none focus:border-none"
                                >
                                  <Check className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="text-red-600 hover:text-red-800 focus:outline-none focus:border-none"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  disabled={!currentPeriod.isEditable}
                                  onClick={() => startEditingLoan(loan)}
                                  className="text-blue-600 hover:text-blue-800 focus:outline-none focus:border-none"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button
                                  disabled={!currentPeriod.isEditable}
                                  onClick={() => deleteLoan(loan.id)}
                                  className="text-red-600 hover:text-red-800 focus:outline-none focus:border-none"
                                >
                                  <Trash className="h-5 w-5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Deductions</h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!newDeductionName || !newDeductionAmount) return;
                  addDeduction(e);
                }}
                disabled={!currentPeriod.isEditable}
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors focus:outline-none focus:border-none"
              >
                <Plus className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1">Name</label>
                <input
                  value={newDeductionName}
                  onChange={(e) => setNewDeductionName(e.target.value)}
                  placeholder="e.g. Tax, Loan, or Saving"
                  list="deduction-history"
                  className="w-full h-10 px-3 py-2 border rounded-md"
                  disabled={!currentPeriod.isEditable}
                />
                <datalist
                  id="deduction-history"
                  style={{ maxHeight: "150px", overflowY: "auto" }}
                >
                  {allDeductionOptions.map((name, index) => (
                    <option key={index} value={name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    ₱
                  </span>
                  <input
                    type="number"
                    value={newDeductionAmount}
                    onChange={(e) => setNewDeductionAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 w-full h-10 px-3 py-2 border rounded-md"
                    disabled={!currentPeriod.isEditable}
                  />
                </div>
              </div>
            </div>

            {currentPeriod.deductions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentPeriod.deductions.map((deduction) => {
                      const associatedLoan = deduction.loanId
                        ? loans.find((l) => l.id === deduction.loanId)
                        : null;
                      const associatedSaving = deduction.savingId
                        ? savings.find((s) => s.id === deduction.savingId)
                        : null;

                      return (
                        <tr key={deduction.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {deduction.name}
                              {associatedLoan && (
                                <div className="text-xs text-gray-500">
                                  Loan: {formatCurrency(associatedLoan.total)}
                                </div>
                              )}
                              {associatedSaving && (
                                <div className="text-xs text-gray-500">
                                  Saving:{" "}
                                  {formatCurrency(associatedSaving.total)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(deduction.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 capitalize">
                              {deduction.type}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              disabled={!currentPeriod.isEditable}
                              onClick={() => togglePaidStatus(deduction.id)}
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                                deduction.paid
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              } focus:outline-none focus:border-none`}
                            >
                              {deduction.paid ? "Paid" : "Unpaid"}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              disabled={!currentPeriod.isEditable}
                              onClick={() =>
                                setPeriods(
                                  periods.map((p) => ({
                                    ...p,
                                    deductions: p.deductions.filter(
                                      (d) => d.id !== deduction.id
                                    ),
                                  }))
                                )
                              }
                              className="text-red-600 hover:text-red-900 focus:outline-none focus:border-none"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SalaryTracker;
