import { Progress } from '@/components/ui/progress'

interface UploadProgressBarProps {
  current: number
  total: number
}

export function UploadProgressBar({ current, total }: UploadProgressBarProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-caption text-muted-foreground">
          Uploading <span className="font-mono text-foreground">{current}</span> of <span className="font-mono text-foreground">{total}</span>
        </p>
        <p className="font-mono text-data text-foreground">{percentage}%</p>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  )
}
