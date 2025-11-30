<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MonthlyReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $reportData;
    public string $monthName;
    public string $year;
    public string $periodStart;
    public string $periodEnd;

    /**
     * Create a new message instance.
     */
    public function __construct(array $reportData, string $monthName, string $year, string $periodStart, string $periodEnd)
    {
        $this->reportData = $reportData;
        $this->monthName = $monthName;
        $this->year = $year;
        $this->periodStart = $periodStart;
        $this->periodEnd = $periodEnd;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = sprintf('Báo cáo thống kê tháng %s/%s - ShoeX', $this->monthName, $this->year);

        return $this->subject($subject)
            ->view('emails.reports.monthly-report')
            ->with([
                'reportData' => $this->reportData,
                'monthName' => $this->monthName,
                'year' => $this->year,
                'periodStart' => $this->periodStart,
                'periodEnd' => $this->periodEnd,
            ]);
    }
}
