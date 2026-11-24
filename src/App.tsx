import { useEffect, useMemo, useState, type ReactNode } from "react";

type Risk = "긴급" | "높음" | "보통";
type Status =
  | "AI 분석 중"
  | "승인 대기"
  | "조치 중"
  | "재검증"
  | "기한 임박"
  | "기한 초과"
  | "보완 요청";
type Page = "dashboard" | "vulnerabilities" | "assets" | "tickets" | "reports";
type QueueView = "list" | "calendar";
type RecheckReport = {
  vulnerabilityId: string;
  version: number;
  createdAt: string;
  componentCount: number;
};
type ArchivedReport = {
  id: string;
  vulnerabilityId: string;
  cve: string;
  title: string;
  version: number;
  archivedAt: string;
  owner: string;
};

type Vulnerability = {
  id: string;
  cve: string;
  title: string;
  service: string;
  package: string;
  version: string;
  risk: Risk;
  score: number;
  status: Status;
  owner: string;
  initials: string;
  due: string;
  kev?: boolean;
};

const vulnerabilities: Vulnerability[] = [
  {
    id: "VUL-2419",
    cve: "CVE-2024-3094",
    title: "XZ Utils 공급망 백도어",
    service: "결제 API",
    package: "xz-utils",
    version: "5.6.1",
    risk: "긴급",
    score: 98,
    status: "승인 대기",
    owner: "윤예린",
    initials: "윤",
    due: "3시간 12분",
    kev: true,
  },
  {
    id: "VUL-2418",
    cve: "CVE-2024-21626",
    title: "컨테이너 격리 우회 취약점",
    service: "주문 처리",
    package: "runc",
    version: "1.1.11",
    risk: "긴급",
    score: 94,
    status: "AI 분석 중",
    owner: "박지훈",
    initials: "박",
    due: "7시간 46분",
    kev: true,
  },
  {
    id: "VUL-2416",
    cve: "CVE-2023-44487",
    title: "HTTP/2 Rapid Reset 공격",
    service: "고객 포털",
    package: "nginx",
    version: "1.25.2",
    risk: "높음",
    score: 87,
    status: "조치 중",
    owner: "이민지",
    initials: "이",
    due: "2일 4시간",
  },
  {
    id: "VUL-2413",
    cve: "CVE-2024-23897",
    title: "CLI 임의 파일 읽기 취약점",
    service: "CI 파이프라인",
    package: "jenkins-core",
    version: "2.441",
    risk: "높음",
    score: 82,
    status: "재검증",
    owner: "최현우",
    initials: "최",
    due: "4일 8시간",
    kev: true,
  },
  {
    id: "VUL-2408",
    cve: "CVE-2023-38545",
    title: "SOCKS5 힙 버퍼 오버플로",
    service: "파일 전송",
    package: "curl",
    version: "8.3.0",
    risk: "보통",
    score: 64,
    status: "AI 분석 중",
    owner: "정유진",
    initials: "정",
    due: "18일",
  },
];

const addDays = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const initialDeadlines: Record<string, string> = {
  "VUL-2419": addDays(0),
  "VUL-2418": addDays(0),
  "VUL-2416": addDays(2),
  "VUL-2413": addDays(4),
  "VUL-2408": addDays(18),
};

const getDaysLeft = (deadline: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${deadline}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
};

const formatDeadline = (deadline: string) =>
  new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(
    new Date(`${deadline}T00:00:00`),
  );

const formatShortDeadline = (deadline: string) => {
  const [, month, day] = deadline.split("-");
  return `${month}/${day}`;
};

const getEffectiveStatus = (
  item: Vulnerability,
  deadline: string,
  approved: boolean,
  correctionRequested = false,
  verificationRequested = false,
): Status => {
  if (verificationRequested) return "재검증";
  if (approved) return "조치 중";
  if (correctionRequested) return "보완 요청";
  const daysLeft = getDaysLeft(deadline);
  if (daysLeft < 0) return "기한 초과";
  if (daysLeft <= 1) return "기한 임박";
  return item.status;
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    shield: <path d="M12 3 5 6v5c0 4.8 2.8 8.2 7 10 4.2-1.8 7-5.2 7-10V6l-7-3Z" />,
    box: (
      <>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7M12 11v10" />
      </>
    ),
    ticket: (
      <>
        <path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Z" />
        <path d="M12 8v8" />
      </>
    ),
    report: (
      <>
        <path d="M6 3h9l4 4v14H6V3Z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 5 5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
        <path d="M10 21h4" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    sparkle: (
      <>
        <path d="m12 3 1.2 4.3L17 9l-3.8 1.7L12 15l-1.2-4.3L7 9l3.8-1.7L12 3Z" />
        <path d="m18 15 .6 2 2 .5-2 .6-.6 1.9-.6-1.9-1.9-.6 1.9-.5.6-2Z" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m7 7 10 10M17 7 7 17" />,
    link: (
      <>
        <path d="m9.5 14.5 5-5M7.2 17H6a4 4 0 0 1 0-8h3M16.8 7H18a4 4 0 0 1 0 8h-3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function RiskBadge({ risk }: { risk: Risk }) {
  return <span className={`risk risk--${risk}`}>{risk}</span>;
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status status--${status.replaceAll(" ", "-")}`}>
      <i />
      {status}
    </span>
  );
}

function CalendarView({
  items,
  onSelect,
  recheckIds,
}: {
  items: Vulnerability[];
  onSelect: (id: string) => void;
  recheckIds: string[];
}) {
  const dates: Record<number, Vulnerability[]> = {
    3: items.filter((_, index) => index === 0),
    5: items.filter((_, index) => index === 1),
    12: items.filter((_, index) => index === 2),
    18: items.filter((_, index) => index === 3),
    27: items.filter((_, index) => index === 4),
  };

  return (
    <div className="calendar">
      <div className="calendar-title">
        <button aria-label="이전 달">‹</button>
        <b>2025년 6월</b>
        <button aria-label="다음 달">›</button>
      </div>
      <div className="calendar-week">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: 35 }, (_, index) => {
          const date = index - 5;
          const inMonth = date > 0 && date <= 30;
          return (
            <div className={`calendar-day ${inMonth ? "" : "outside"}`} key={index}>
              <span className={date === 3 ? "today" : ""}>{inMonth ? date : ""}</span>
              {inMonth &&
                dates[date]?.map((item) => (
                  <button
                    className={`calendar-event calendar-event--${item.risk}`}
                    onClick={() => onSelect(item.id)}
                    key={item.id}
                  >
                    <i />
                    <b>{item.cve.replace("CVE-", "")}</b>
                    {recheckIds.includes(item.id) && <em>v2</em>}
                    <small>{item.service}</small>
                  </button>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionPage({
  page,
  audits,
  onOpenReport,
  approvedIds,
  correctionIds,
  verificationIds,
  recheckReports,
  archivedReports,
  deadlines,
  onDeadlineChange,
}: {
  page: Exclude<Page, "dashboard">;
  audits: Array<{ id: string; title: string; detail: string; time: string }>;
  onOpenReport: (id: string) => void;
  approvedIds: string[];
  correctionIds: string[];
  verificationIds: string[];
  recheckReports: RecheckReport[];
  archivedReports: ArchivedReport[];
  deadlines: Record<string, string>;
  onDeadlineChange: (id: string, deadline: string) => void;
}) {
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [showSbomCreator, setShowSbomCreator] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [sbomErrors, setSbomErrors] = useState<{ project?: string; url?: string }>({});
  const [createdProjects, setCreatedProjects] = useState<string[]>([]);
  const [showReportExport, setShowReportExport] = useState(false);
  const [reportType, setReportType] = useState("월간 취약점 대응 보고서");
  const [printReport, setPrintReport] = useState<string | null>(null);
  const [previewReportId, setPreviewReportId] = useState<string | null>(null);
  const [closedPrintTargetId, setClosedPrintTargetId] = useState<string | null>(null);
  const [showClosedPrintSelector, setShowClosedPrintSelector] = useState(false);
  const [closedPrintOption, setClosedPrintOption] = useState<"initial" | "recheck" | "both">(
    "initial",
  );
  const [closedPrintVersion, setClosedPrintVersion] = useState<number | "both" | null>(null);
  const [closedStartDate, setClosedStartDate] = useState("2025-05-01");
  const [closedEndDate, setClosedEndDate] = useState("2025-06-30");
  const [vulnerabilityTab, setVulnerabilityTab] = useState<"전체" | "긴급" | "KEV" | "해결">(
    "전체",
  );
  const config = {
    vulnerabilities: {
      eyebrow: "VULNERABILITY INVENTORY",
      title: "취약점 관리",
      description: "발견된 취약점의 영향 범위와 대응 상태를 통합 관리합니다.",
    },
    assets: {
      eyebrow: "SOFTWARE BILL OF MATERIALS",
      title: "SBOM 자산",
      description: "서비스별 오픈소스 구성요소와 공급망 위험을 확인합니다.",
    },
    tickets: {
      eyebrow: "REMEDIATION TICKETS",
      title: "조치 티켓",
      description: "승인된 조치의 적용과 재검증 진행 상황을 추적합니다.",
    },
    reports: {
      eyebrow: "AUDIT & COMPLIANCE",
      title: "감사 및 보고서",
      description: "모든 AI 판단, 승인, 조치 이력을 변경 불가능한 로그로 확인합니다.",
    },
  }[page];

  const serviceAssetMap: Record<string, string> = {
    "결제 API": "payment-api",
    "주문 처리": "order-worker",
    "고객 포털": "customer-web",
    "CI 파이프라인": "ci-platform",
    "파일 전송": "file-transfer",
  };
  const baseAssetRows = [
    ...createdProjects.map((name) => [name, "0", "분석 중", "CycloneDX 1.5", "방금 전"]),
    ["payment-api", "328", "12", "CycloneDX 1.5", "방금 전"],
    ["order-worker", "214", "7", "SPDX 2.3", "12분 전"],
    ["customer-web", "496", "18", "CycloneDX 1.5", "1시간 전"],
    ["ci-platform", "146", "4", "SPDX 2.3", "3시간 전"],
  ];
  const assetRows = baseAssetRows.map((row) => {
    const recheck = recheckReports.find((report) => {
      const vulnerability = vulnerabilities.find((item) => item.id === report.vulnerabilityId);
      return vulnerability && serviceAssetMap[vulnerability.service] === row[0];
    });
    if (!recheck) return row;
    return [row[0], String(recheck.componentCount), row[2], row[3], recheck.createdAt];
  });
  const ticketRows = [
    ["TKT-8421", "XZ Utils 공급망 백도어", "적용 대기", "윤예린", "3시간 12분", "VUL-2419"],
    ["TKT-8418", "컨테이너 격리 우회 취약점", "조치 중", "박지훈", "7시간 46분", "VUL-2418"],
    ["TKT-8402", "HTTP/2 Rapid Reset 공격", "재검증", "이민지", "2일 4시간", "VUL-2416"],
    ["TKT-8394", "CLI 임의 파일 읽기 취약점", "보완 요청", "최현우", "4일 8시간", "VUL-2413"],
  ];
  const vulnerabilityTabCounts = { 전체: 214, 긴급: 12, KEV: 31, 해결: 143 };
  const filteredVulnerabilities = vulnerabilities.filter((item) => {
    if (vulnerabilityTab === "긴급") return item.risk === "긴급";
    if (vulnerabilityTab === "KEV") return item.kev;
    if (vulnerabilityTab === "해결") return item.id === "VUL-2408";
    return true;
  });
  const previewItem = vulnerabilities.find((item) => item.id === previewReportId);
  const closedPrintItem = vulnerabilities.find((item) => item.id === closedPrintTargetId);
  const closedPrintRecheck = recheckReports.find(
    (report) => report.vulnerabilityId === closedPrintTargetId,
  );
  const closedTicketReports = [
    [
      "TKT-8378",
      "CVE-2023-38545",
      "SOCKS5 힙 버퍼 오버플로",
      "파일 전송",
      "2025. 06. 02",
      "VUL-2408",
      "2025-06-02",
    ],
    [
      "TKT-8361",
      "CVE-2024-23897",
      "CLI 임의 파일 읽기 취약점",
      "CI 파이프라인",
      "2025. 05. 29",
      "VUL-2413",
      "2025-05-29",
    ],
    [
      "TKT-8344",
      "CVE-2023-44487",
      "HTTP/2 Rapid Reset 공격",
      "고객 포털",
      "2025. 05. 24",
      "VUL-2416",
      "2025-05-24",
    ],
    [
      "TKT-8312",
      "CVE-2024-21626",
      "컨테이너 격리 우회 취약점",
      "주문 처리",
      "2025. 05. 18",
      "VUL-2418",
      "2025-05-18",
    ],
  ];
  const filteredClosedReports = closedTicketReports.filter(
    (report) => report[6] >= closedStartDate && report[6] <= closedEndDate,
  );
  return (
    <>
      <section className="page-heading secondary-heading">
        <div>
          <p className="eyebrow">{config.eyebrow}</p>
          <h1>{config.title}</h1>
          <span>{config.description}</span>
        </div>
        {(page === "assets" || page === "reports") && (
          <button
            className="page-action"
            onClick={() => {
              if (page === "assets") setShowSbomCreator(true);
              if (page === "reports") setShowReportExport(true);
            }}
          >
            {page === "reports" ? "보고서 내보내기" : "SBOM 생성"}
          </button>
        )}
      </section>

      {page === "assets" && showSbomCreator && (
        <div className="modal-backdrop" role="presentation">
          <form
            className="sbom-creator"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const errors: { project?: string; url?: string } = {};
              if (!projectName.trim()) errors.project = "프로젝트명을 입력해주세요.";
              try {
                const parsedUrl = new URL(repositoryUrl);
                if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                  errors.url = "정확한 URL을 입력해주세요.";
                }
              } catch {
                errors.url = "정확한 URL을 입력해주세요.";
              }
              setSbomErrors(errors);
              if (Object.keys(errors).length > 0) return;
              setCreatedProjects((current) => [projectName.trim(), ...current]);
              setProjectName("");
              setRepositoryUrl("");
              setSbomErrors({});
              setShowSbomCreator(false);
            }}
          >
            <div className="sbom-creator-header">
              <div>
                <span>NEW SBOM PROJECT</span>
                <h2>SBOM 생성</h2>
                <p>프로젝트를 등록하고 소프트웨어 구성요소 수집을 시작합니다.</p>
              </div>
              <button type="button" onClick={() => setShowSbomCreator(false)} aria-label="닫기">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="sbom-form">
              <label>
                <span className="field-label">
                  프로젝트명
                  {sbomErrors.project && <em>{sbomErrors.project}</em>}
                </span>
                <input
                  value={projectName}
                  className={sbomErrors.project ? "has-error" : ""}
                  onChange={(event) => {
                    setProjectName(event.target.value);
                    setSbomErrors((current) => ({ ...current, project: undefined }));
                  }}
                  placeholder="예: payment-api"
                  autoFocus
                />
              </label>
              <label>
                <span className="field-label">
                  저장소 URL
                  {sbomErrors.url && <em>{sbomErrors.url}</em>}
                </span>
                <input
                  type="text"
                  inputMode="url"
                  value={repositoryUrl}
                  className={sbomErrors.url ? "has-error" : ""}
                  onChange={(event) => {
                    setRepositoryUrl(event.target.value);
                    setSbomErrors((current) => ({ ...current, url: undefined }));
                  }}
                  placeholder="https://github.com/company/project"
                />
              </label>
              <div>
                <label>
                  <span>담당 팀</span>
                  <input placeholder="예: Platform Team" />
                </label>
                <label>
                  <span>운영 환경</span>
                  <select defaultValue="production">
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </label>
              </div>
              <label>
                <span>SBOM 생성 방식</span>
                <div className="generation-options">
                  <button type="button" className="selected">
                    <Icon name="link" size={15} />
                    CI/CD 자동 연동
                  </button>
                  <button type="button">
                    <Icon name="box" size={15} />
                    파일 업로드
                  </button>
                </div>
              </label>
            </div>
            <div className="sbom-creator-actions">
              <button type="button" className="secondary" onClick={() => setShowSbomCreator(false)}>
                취소
              </button>
              <button type="submit" className="primary">
                <Icon name="sparkle" size={15} /> SBOM 생성 시작
              </button>
            </div>
          </form>
        </div>
      )}

      {page === "reports" && showReportExport && (
        <div className="modal-backdrop" role="presentation">
          <form
            className="export-dialog"
            onSubmit={(event) => {
              event.preventDefault();
              setClosedPrintVersion(null);
              setPrintReport(reportType);
              setShowReportExport(false);
              window.setTimeout(() => window.print(), 100);
            }}
          >
            <div className="sbom-creator-header">
              <div>
                <span>EXPORT REPORT</span>
                <h2>보고서 내보내기</h2>
                <p>내보낼 보고서를 선택하면 PDF 저장 화면이 열립니다.</p>
              </div>
              <button type="button" onClick={() => setShowReportExport(false)} aria-label="닫기">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="report-options">
              {[
                ["월간 취약점 대응 보고서", "발견·조치·종결 현황과 주요 위험 요약"],
                ["SLA 준수 보고서", "기한 준수율, 초과 이력과 담당자별 현황"],
                ["SBOM 자산 현황", "서비스와 구성요소, 라이선스 및 공급망 위험"],
                ["감사 로그 전체", "AI 판단, 승인, 보완, 재검증 작업 전체 이력"],
              ].map(([title, description]) => (
                <label className={reportType === title ? "selected" : ""} key={title}>
                  <input
                    type="radio"
                    name="report"
                    value={title}
                    checked={reportType === title}
                    onChange={() => setReportType(title)}
                  />
                  <span>
                    <Icon name="report" size={17} />
                  </span>
                  <div>
                    <b>{title}</b>
                    <small>{description}</small>
                  </div>
                  <i>{reportType === title && <Icon name="check" size={12} />}</i>
                </label>
              ))}
            </div>
            <div className="sbom-creator-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowReportExport(false)}
              >
                취소
              </button>
              <button type="submit" className="primary">
                <Icon name="report" size={15} /> PDF로 내보내기
              </button>
            </div>
          </form>
        </div>
      )}

      {page === "reports" && previewItem && (
        <div className="modal-backdrop">
          <div className="closed-preview-modal">
            <div className="sbom-creator-header">
              <div>
                <span>CLOSED VULNERABILITY REPORT</span>
                <h2>보고서 미리보기</h2>
                <p>종결 시점에 확정된 취약점 보고서입니다.</p>
              </div>
              <button onClick={() => setPreviewReportId(null)} aria-label="닫기">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="closed-preview-content">
              <div className="preview-report-heading">
                <div>
                  <span>{previewItem.cve}</span>
                  <h3>{previewItem.title}</h3>
                </div>
                <span className="closed-status">
                  <Icon name="check" size={13} /> 종결
                </span>
              </div>
              <div className="preview-report-metrics">
                <div>
                  <span>위험도</span>
                  <RiskBadge risk={previewItem.risk} />
                </div>
                <div>
                  <span>CVSS</span>
                  <b>{previewItem.score / 10}</b>
                </div>
                <div>
                  <span>영향 서비스</span>
                  <b>{previewItem.service}</b>
                </div>
                <div>
                  <span>취약 구성요소</span>
                  <b>
                    {previewItem.package} {previewItem.version}
                  </b>
                </div>
              </div>
              <div className="preview-report-summary">
                <b>종결 요약</b>
                <p>
                  {previewItem.package} 패키지를 안전 버전으로 업데이트하고 SBOM을 재수집했습니다.
                  재검증 결과 취약 버전이 더 이상 탐지되지 않아 티켓을 종결했습니다.
                </p>
              </div>
              <div className="preview-report-checks">
                <span>
                  <Icon name="check" size={12} /> 패치 적용 확인
                </span>
                <span>
                  <Icon name="check" size={12} /> 취약 버전 미탐지
                </span>
                <span>
                  <Icon name="check" size={12} /> 신규 CVE 없음
                </span>
              </div>
            </div>
            <div className="sbom-creator-actions">
              <button className="secondary" onClick={() => setPreviewReportId(null)}>
                닫기
              </button>
              <button
                className="primary"
                onClick={() => {
                  setClosedPrintTargetId(previewItem.id);
                  setClosedPrintOption("initial");
                  setPreviewReportId(null);
                  setShowClosedPrintSelector(true);
                }}
              >
                <Icon name="report" size={14} /> 보고서 출력
              </button>
            </div>
          </div>
        </div>
      )}

      {page === "reports" && showClosedPrintSelector && closedPrintItem && (
        <div className="modal-backdrop">
          <form
            className="export-dialog"
            onSubmit={(event) => {
              event.preventDefault();
              setPrintReport(null);
              setShowClosedPrintSelector(false);
              setClosedPrintVersion(
                closedPrintOption === "initial"
                  ? 1
                  : closedPrintOption === "recheck"
                    ? (closedPrintRecheck?.version ?? 2)
                    : "both",
              );
              window.setTimeout(() => window.print(), 100);
            }}
          >
            <div className="sbom-creator-header">
              <div>
                <span>SELECT REPORT</span>
                <h2>보고서 출력</h2>
                <p>출력할 보고서를 선택해주세요.</p>
              </div>
              <button type="button" onClick={() => setShowClosedPrintSelector(false)}>
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="report-options">
              <label className={closedPrintOption === "initial" ? "selected" : ""}>
                <input
                  type="radio"
                  checked={closedPrintOption === "initial"}
                  onChange={() => setClosedPrintOption("initial")}
                />
                <span>
                  <Icon name="report" size={17} />
                </span>
                <div>
                  <b>기존 보고서</b>
                  <small>최초 위험 분석과 조치 결과</small>
                </div>
                <i>{closedPrintOption === "initial" && <Icon name="check" size={12} />}</i>
              </label>
              {closedPrintRecheck && (
                <>
                  <label className={closedPrintOption === "recheck" ? "selected" : ""}>
                    <input
                      type="radio"
                      checked={closedPrintOption === "recheck"}
                      onChange={() => setClosedPrintOption("recheck")}
                    />
                    <span>
                      <Icon name="shield" size={17} />
                    </span>
                    <div>
                      <b>재검증 보고서</b>
                      <small>재수집 SBOM과 검증 결과</small>
                    </div>
                    <i>{closedPrintOption === "recheck" && <Icon name="check" size={12} />}</i>
                  </label>
                  <label className={closedPrintOption === "both" ? "selected" : ""}>
                    <input
                      type="radio"
                      checked={closedPrintOption === "both"}
                      onChange={() => setClosedPrintOption("both")}
                    />
                    <span>
                      <Icon name="box" size={17} />
                    </span>
                    <div>
                      <b>기존 + 재검증 보고서</b>
                      <small>두 보고서를 별도 페이지로 출력</small>
                    </div>
                    <i>{closedPrintOption === "both" && <Icon name="check" size={12} />}</i>
                  </label>
                </>
              )}
            </div>
            <div className="sbom-creator-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowClosedPrintSelector(false)}
              >
                취소
              </button>
              <button type="submit" className="primary">
                <Icon name="report" size={14} /> 선택한 보고서 출력
              </button>
            </div>
          </form>
        </div>
      )}

      {page === "reports" && printReport && (
        <section className="print-sheet">
          <header>
            <div>
              <b>SENTRA</b>
              <span>SECURITY OPERATIONS REPORT</span>
            </div>
            <small>생성일 {new Date().toLocaleDateString("ko-KR")}</small>
          </header>
          <h1>{printReport}</h1>
          <p>I. Cloud 보안 운영 환경의 SBOM 기반 취약점 대응 결과입니다.</p>
          <div className="print-metrics">
            <div>
              <span>전체 취약점</span>
              <b>214</b>
            </div>
            <div>
              <span>종결</span>
              <b>143</b>
            </div>
            <div>
              <span>SLA 준수율</span>
              <b>96.8%</b>
            </div>
            <div>
              <span>감사 이벤트</span>
              <b>{1_836 + audits.length}</b>
            </div>
          </div>
          <h2>주요 운영 현황</h2>
          <table>
            <thead>
              <tr>
                <th>구분</th>
                <th>대상</th>
                <th>상태</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>긴급 취약점</td>
                <td>12건</td>
                <td>조치 진행</td>
                <td>24시간 SLA</td>
              </tr>
              <tr>
                <td>승인 대기</td>
                <td>8건</td>
                <td>담당자 검토</td>
                <td>2건 기한 임박</td>
              </tr>
              <tr>
                <td>재검증</td>
                <td>4건</td>
                <td>SBOM 재수집</td>
                <td>자동 검증 중</td>
              </tr>
              <tr>
                <td>종결</td>
                <td>143건</td>
                <td>완료</td>
                <td>감사 로그 보관</td>
              </tr>
            </tbody>
          </table>
          <footer>본 문서는 SENTRA에서 자동 생성되었습니다. · I. Cloud Security Operations</footer>
        </section>
      )}

      {page === "reports" && closedPrintVersion && closedPrintItem && (
        <section className="print-sheet vulnerability-print">
          {(closedPrintVersion === "both"
            ? [1, closedPrintRecheck?.version ?? 2]
            : [closedPrintVersion]
          ).map((version, index) => (
            <div className={`print-report-page ${index > 0 ? "new-page" : ""}`} key={version}>
              <header>
                <div>
                  <b>SENTRA</b>
                  <span>CLOSED VULNERABILITY REPORT</span>
                </div>
                <small>출력일 {new Date().toLocaleDateString("ko-KR")}</small>
              </header>
              <div className="print-version">REPORT VERSION · v{version}</div>
              <h1>{version === 1 ? "종결 취약점 보고서" : "재검증 취약점 보고서"}</h1>
              <p>
                {closedPrintItem.cve} · {closedPrintItem.title}
              </p>
              <div className="print-metrics">
                <div>
                  <span>위험도</span>
                  <b>{closedPrintItem.risk}</b>
                </div>
                <div>
                  <span>CVSS</span>
                  <b>{closedPrintItem.score / 10}</b>
                </div>
                <div>
                  <span>영향 서비스</span>
                  <b>{closedPrintItem.service}</b>
                </div>
                <div>
                  <span>종결 상태</span>
                  <b>완료</b>
                </div>
              </div>
              <h2>취약점 기준 정보</h2>
              <table>
                <tbody>
                  <tr>
                    <th>CVE</th>
                    <td>{closedPrintItem.cve}</td>
                    <th>보고서 버전</th>
                    <td>v{version}</td>
                  </tr>
                  <tr>
                    <th>취약 구성요소</th>
                    <td>
                      {closedPrintItem.package} {closedPrintItem.version}
                    </td>
                    <th>담당자</th>
                    <td>{closedPrintItem.owner}</td>
                  </tr>
                  <tr>
                    <th>영향 서비스</th>
                    <td>{closedPrintItem.service}</td>
                    <th>처리 결과</th>
                    <td>취약점 해소 확인</td>
                  </tr>
                </tbody>
              </table>
              <h2>{version === 1 ? "조치 및 종결 결과" : "재검증 결과"}</h2>
              <table>
                <tbody>
                  <tr>
                    <th>패치 적용</th>
                    <td>안전 버전 업데이트 완료</td>
                    <th>SBOM</th>
                    <td>재수집 완료</td>
                  </tr>
                  <tr>
                    <th>취약 버전</th>
                    <td>미탐지</td>
                    <th>신규 CVE</th>
                    <td>탐지 없음</td>
                  </tr>
                </tbody>
              </table>
              <footer>본 보고서는 SENTRA에서 생성되었으며 감사 이력과 함께 보관됩니다.</footer>
            </div>
          ))}
        </section>
      )}

      {page === "vulnerabilities" && (
        <section className="data-page-card">
          <div className="data-toolbar">
            <div className="tabs">
              {(["전체", "긴급", "KEV", "해결"] as const).map((tab) => (
                <button
                  className={vulnerabilityTab === tab ? "active" : ""}
                  onClick={() => setVulnerabilityTab(tab)}
                  key={tab}
                >
                  {tab}
                  {vulnerabilityTab === tab && ` (${vulnerabilityTabCounts[tab]})`}
                </button>
              ))}
            </div>
          </div>
          <div className="wide-table">
            <div className="wide-row wide-head">
              <span>CVE / 취약점</span>
              <span>영향 자산</span>
              <span>위험도</span>
              <span>상태</span>
              <span>SLA / D-DAY</span>
            </div>
            {filteredVulnerabilities.map((item) => (
              <button
                className="wide-row vulnerability-link-row"
                onClick={() => onOpenReport(item.id)}
                key={item.id}
              >
                <div>
                  <b>{item.cve}</b>
                  {recheckReports.some((report) => report.vulnerabilityId === item.id) && (
                    <span className="report-version-badge">v2 재검증</span>
                  )}
                  <small>{item.title}</small>
                </div>
                <div>
                  <b>{item.service}</b>
                  <small>
                    {item.package} {item.version}
                  </small>
                </div>
                <RiskBadge risk={item.risk} />
                <StatusBadge
                  status={getEffectiveStatus(
                    item,
                    deadlines[item.id],
                    approvedIds.includes(item.id),
                    correctionIds.includes(item.id),
                    verificationIds.includes(item.id),
                  )}
                />
                <div
                  className={`sla-cell ${getDaysLeft(deadlines[item.id]) <= 0 ? "urgent" : ""}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  {editingDeadlineId === item.id ? (
                    <div className="deadline-editor">
                      <input
                        type="date"
                        value={deadlines[item.id]}
                        onChange={(event) => onDeadlineChange(item.id, event.target.value)}
                      />
                      <button onClick={() => setEditingDeadlineId(null)}>완료</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <b>D-{Math.max(0, getDaysLeft(deadlines[item.id]))}</b>
                        <span className="sla-date">{formatShortDeadline(deadlines[item.id])}</span>
                        <button onClick={() => setEditingDeadlineId(item.id)}>기한 수정</button>
                      </div>
                    </>
                  )}
                </div>
                <Icon name="arrow" size={14} />
              </button>
            ))}
          </div>
        </section>
      )}

      {page === "assets" && (
        <>
          <section className="mini-stats">
            <article>
              <div className="asset-stat-label">
                <span className="asset-stat-icon services">
                  <Icon name="box" size={16} />
                </span>
                <span>등록 서비스</span>
              </div>
              <b>48</b>
              <small>전월 대비 +4</small>
            </article>
            <article>
              <div className="asset-stat-label">
                <span className="asset-stat-icon components">
                  <Icon name="grid" size={16} />
                </span>
                <span>구성요소</span>
              </div>
              <b>1,284</b>
              <small>직접 의존성 37%</small>
            </article>
            <article>
              <div className="asset-stat-label">
                <span className="asset-stat-icon licenses">
                  <Icon name="shield" size={16} />
                </span>
                <span>라이선스 경고</span>
              </div>
              <b>6</b>
              <small>검토 필요</small>
            </article>
          </section>
          <section className="data-page-card">
            <div className="data-toolbar">
              <b>서비스 자산 목록</b>
              <button className="filter-button">
                <Icon name="search" size={15} /> 자산 검색
              </button>
            </div>
            <div className="wide-table assets-table">
              <div className="wide-row wide-head">
                <span>서비스</span>
                <span>구성요소</span>
                <span>취약점</span>
                <span>표준</span>
                <span>최근 동기화</span>
              </div>
              {assetRows.map((row) => (
                <div className="wide-row" key={row[0]}>
                  {row.map((cell, i) => (
                    <div key={cell}>
                      <b>{cell}</b>
                      {i === 0 && <small>production · owner: platform</small>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {page === "tickets" && (
        <section className="ticket-board">
          {["적용 대기", "조치 중", "재검증", "완료"].map((column, columnIndex) => (
            <div className="ticket-column" key={column}>
              <div className="ticket-column-title">
                <b>{column}</b>
                <span>{columnIndex === 3 ? 143 : columnIndex + 2}</span>
              </div>
              {ticketRows
                .filter((_, i) => i % 3 === columnIndex || (columnIndex === 3 && i === 3))
                .map((row) => (
                  <button className="ticket-card" onClick={() => onOpenReport(row[5])} key={row[0]}>
                    <span>{row[0]}</span>
                    <h3>{row[1]}</h3>
                    <div>
                      <span className="avatar small">{row[3][0]}</span>
                      <b>{row[3]}</b>
                      <small>{row[4]}</small>
                    </div>
                    <span className="ticket-open">
                      보고서 보기 <Icon name="arrow" size={12} />
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </section>
      )}

      {page === "reports" && (
        <>
          <section className="report-summary">
            <div>
              <span>감사 이벤트</span>
              <b>{1_836 + audits.length}</b>
              <small>최근 30일</small>
            </div>
            <div>
              <span>승인 이력</span>
              <b>{328 + audits.length}</b>
              <small>누락 0건</small>
            </div>
            <div>
              <span>SLA 준수율</span>
              <b>96.8%</b>
              <small>목표 95%</small>
            </div>
            <div className="compliance">
              <Icon name="shield" />
              <p>
                <b>감사 로그 무결성 정상</b>
                <span>마지막 검증 오늘 10:24</span>
              </p>
            </div>
          </section>
          {archivedReports.length > 0 && (
            <section className="archived-reports">
              <div className="data-toolbar">
                <div>
                  <b>재검증 이전 보고서</b>
                  <span>재검증 요청 시점에 변경 불가능한 이전 버전으로 보관됨</span>
                </div>
                <span className="archive-count">{archivedReports.length}건 보관</span>
              </div>
              <div className="archived-report-list">
                {archivedReports.map((report) => (
                  <article key={report.id}>
                    <span className="archive-icon">
                      <Icon name="report" size={15} />
                    </span>
                    <div>
                      <b>{report.title}</b>
                      <small>
                        {report.cve} · 담당자 {report.owner}
                      </small>
                    </div>
                    <span className="version-chip">v{report.version} 이전 버전</span>
                    <span className="archive-time">
                      <small>보관 시각</small>
                      {report.archivedAt}
                    </span>
                    <span className="immutable-chip">
                      <Icon name="shield" size={12} /> 변경 불가
                    </span>
                  </article>
                ))}
              </div>
            </section>
          )}
          <section className="closed-reports">
            <div className="data-toolbar">
              <div>
                <b>종결 티켓 보고서</b>
                <span>재검증을 통과하고 종결된 취약점 보고서</span>
              </div>
              <div className="closed-period-filter">
                <span>종결 기간</span>
                <input
                  type="date"
                  value={closedStartDate}
                  max={closedEndDate}
                  onChange={(event) => setClosedStartDate(event.target.value)}
                />
                <i>–</i>
                <input
                  type="date"
                  value={closedEndDate}
                  min={closedStartDate}
                  onChange={(event) => setClosedEndDate(event.target.value)}
                />
                <span className="closed-count">{filteredClosedReports.length}건</span>
              </div>
            </div>
            <div className="closed-report-list">
              {filteredClosedReports.map(([ticket, cve, title, service, date, id]) => (
                <article key={ticket}>
                  <span className="closed-icon">
                    <Icon name="check" size={14} />
                  </span>
                  <div>
                    <b>{title}</b>
                    <small>
                      {ticket} · {cve} · {service}
                    </small>
                  </div>
                  <span className="closed-date">
                    <small>종결일</small>
                    {date}
                  </span>
                  <div className="closed-report-actions">
                    <button onClick={() => setPreviewReportId(id)}>
                      <Icon name="search" size={13} /> 보고서 미리보기
                    </button>
                    <button
                      className="primary"
                      onClick={() => {
                        setClosedPrintTargetId(id);
                        setClosedPrintOption("initial");
                        setShowClosedPrintSelector(true);
                      }}
                    >
                      <Icon name="report" size={13} /> 보고서 출력
                    </button>
                  </div>
                </article>
              ))}
              {filteredClosedReports.length === 0 && (
                <div className="closed-report-empty">선택한 기간에 종결된 보고서가 없습니다.</div>
              )}
            </div>
          </section>
          <section className="audit-page">
            <div className="data-toolbar">
              <div>
                <b>감사 타임라인</b>
                <span>AI 및 사용자 작업 전체 기록</span>
              </div>
              <button className="filter-button">
                <Icon name="filter" size={15} /> 이벤트 필터
              </button>
            </div>
            <div className="audit-timeline">
              {audits.map((entry) => (
                <article className="audit-entry new" key={entry.id}>
                  <span>
                    <Icon name="check" size={15} />
                  </span>
                  <div>
                    <b>{entry.title}</b>
                    <p>{entry.detail}</p>
                    <small>{entry.time} · 윤예린 · 보안 담당자</small>
                  </div>
                  <i>승인</i>
                </article>
              ))}
              {[
                [
                  "AI 조치안 생성 완료",
                  "CVE-2024-3094 · 공식 권고문 4건을 근거로 패치안 생성",
                  "오늘 09:51",
                  "AI",
                ],
                [
                  "MCP 도구 호출",
                  "payment-api 스테이징 환경 호환성 테스트 실행",
                  "오늘 09:48",
                  "도구",
                ],
                [
                  "SBOM 동기화 완료",
                  "I. Cloud 운영 환경 · 1,284개 구성요소 정규화",
                  "오늘 09:42",
                  "시스템",
                ],
                [
                  "담당자 승인",
                  "CVE-2024-23897 조치안 승인 및 티켓 TKT-8394 생성",
                  "어제 17:32",
                  "승인",
                ],
              ].map(([title, detail, time, type]) => (
                <article className="audit-entry" key={title + time}>
                  <span>
                    <Icon
                      name={type === "승인" ? "check" : type === "AI" ? "sparkle" : "box"}
                      size={15}
                    />
                  </span>
                  <div>
                    <b>{title}</b>
                    <p>{detail}</p>
                    <small>{time}</small>
                  </div>
                  <i>{type}</i>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

function VulnerabilityReport({
  item,
  approved,
  correctionRequested,
  verificationRequested,
  canCancelApproval,
  deadline,
  onApprove,
  onRequestCorrection,
  onRequestVerification,
  onCancelApproval,
  onExit,
  recheckReport,
}: {
  item: Vulnerability;
  approved: boolean;
  correctionRequested: boolean;
  verificationRequested: boolean;
  canCancelApproval: boolean;
  deadline: string;
  onApprove: () => void;
  onRequestCorrection: () => void;
  onRequestVerification: () => void;
  onCancelApproval: () => void;
  onExit: () => void;
  recheckReport?: RecheckReport;
}) {
  const [activeEvidence, setActiveEvidence] = useState<"advisory" | "vendor" | null>(null);
  const [printVersion, setPrintVersion] = useState<number | "both" | null>(null);
  const [showPrintSelector, setShowPrintSelector] = useState(false);
  const [selectedPrintOption, setSelectedPrintOption] = useState<"initial" | "recheck" | "both">(
    "initial",
  );
  const [showRefreshNotice, setShowRefreshNotice] = useState(false);
  useEffect(() => {
    if (!recheckReport) return;
    setShowRefreshNotice(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [recheckReport]);

  const printVulnerabilityReport = (version: number | "both") => {
    setPrintVersion(version);
    window.setTimeout(() => window.print(), 100);
  };
  const evidence =
    activeEvidence === "vendor"
      ? {
          label: "공급사 보안 게시판",
          source: "Vendor Security Advisory",
          summary: `${item.package} ${item.version} 버전에 영향을 주는 보안 결함과 안전 버전 업데이트 절차가 게시되었습니다.`,
          published: "2025. 5. 29.",
          scope: `${item.package} ${item.version} 및 이전 버전`,
          href: `https://osv.dev/vulnerability/${item.cve}`,
        }
      : {
          label: `${item.cve} 공식 권고문`,
          source: "NVD · National Vulnerability Database",
          summary: `${item.cve}는 ${item.service}에서 사용 중인 구성요소에 영향을 주며, 공격 성공 시 서비스 권한으로 임의 코드 실행 또는 데이터 접근이 가능합니다.`,
          published: "2025. 5. 27.",
          scope: `${item.package} ${item.version}`,
          href: `https://nvd.nist.gov/vuln/detail/${item.cve}`,
        };
  const versionsToPrint =
    printVersion === "both" ? [1, recheckReport?.version ?? 2] : printVersion ? [printVersion] : [];

  return (
    <div className="report-detail">
      <div className="report-detail-header">
        <div>
          <button className="exit-button" onClick={onExit}>
            <Icon name="close" size={15} /> 나가기
          </button>
          <div className="report-title-line">
            <p className="eyebrow">VULNERABILITY REMEDIATION REPORT</p>
            <span>{item.id}</span>
          </div>
          <h1>{item.title}</h1>
          <p>{item.cve}에 대한 영향 분석, AI 조치 계획 및 승인 기록입니다.</p>
          <div className="report-inline-meta">
            <span>현재 상태</span>
            <StatusBadge
              status={getEffectiveStatus(
                item,
                deadline,
                approved,
                correctionRequested,
                verificationRequested,
              )}
            />
            <i />
            <span>
              담당자 <b>{item.owner}</b>
            </span>
          </div>
        </div>
        <div className="report-header-side">
          <div className="report-output-actions">
            <button onClick={() => setShowPrintSelector(true)}>
              <Icon name="report" size={14} /> 보고서 출력
            </button>
          </div>
        </div>
      </div>

      {showRefreshNotice && recheckReport && (
        <div className="report-refresh-notice">
          <span>
            <Icon name="check" size={14} />
          </span>
          <div>
            <b>재검증 결과로 화면을 새로고침했습니다</b>
            <small>
              최신 보고서 v{recheckReport.version} · 생성 {recheckReport.createdAt}
            </small>
          </div>
          <button onClick={() => setShowRefreshNotice(false)}>
            <Icon name="close" size={13} />
          </button>
        </div>
      )}

      <section className="report-overview">
        <article>
          <span>위험도</span>
          <div>
            <RiskBadge risk={item.risk} />
            <b>CVSS {item.score / 10}</b>
          </div>
          <small>{item.kev ? "CISA KEV 등재 · 실제 악용 확인" : "공개 권고문 기반 분석"}</small>
        </article>
        <article>
          <span>영향 서비스</span>
          <b>{item.service}</b>
          <small>Production · 인터넷 노출</small>
        </article>
        <article>
          <span>취약 구성요소</span>
          <b>
            {item.package} {item.version}
          </b>
          <small>직접 의존성 · CycloneDX</small>
        </article>
        <article>
          <span>조치 기한</span>
          <b className={getDaysLeft(deadline) <= 0 ? "danger-text" : ""}>
            D-{Math.max(0, getDaysLeft(deadline))} · {formatDeadline(deadline)}
          </b>
          <small>{getDaysLeft(deadline) <= 0 ? "오늘 조치 마감" : "정책 SLA 내 조치"}</small>
        </article>
      </section>

      {recheckReport && (
        <section className="recheck-report">
          <div className="recheck-report-title">
            <span className="recheck-icon">
              <Icon name="shield" size={18} />
            </span>
            <div>
              <span>NEW REVALIDATION REPORT</span>
              <b>재검증 취약점 보고서 v{recheckReport.version}</b>
              <small>새 SBOM 스냅샷을 기준으로 자동 생성된 재점검 보고서입니다.</small>
            </div>
            <span className="recheck-running">
              <i /> 재점검 진행 중
            </span>
          </div>
          <div className="recheck-overview">
            <article>
              <span>위험도</span>
              <div>
                <RiskBadge risk={item.risk} />
                <b>CVSS {item.score / 10}</b>
              </div>
              <small>{item.kev ? "CISA KEV 실제 악용 확인" : "공개 권고문 기준"}</small>
            </article>
            <article>
              <span>영향 서비스</span>
              <b>{item.service}</b>
              <small>Production · 인터넷 노출</small>
            </article>
            <article>
              <span>취약 구성요소</span>
              <b>
                {item.package} {item.version}
              </b>
              <small>재수집 SBOM 기준</small>
            </article>
            <article>
              <span>조치 기한</span>
              <b className={getDaysLeft(deadline) <= 0 ? "danger-text" : ""}>
                D-{Math.max(0, getDaysLeft(deadline))} · {formatDeadline(deadline)}
              </b>
              <small>{getDaysLeft(deadline) <= 0 ? "오늘 조치 마감" : "정책 SLA 내 조치"}</small>
            </article>
          </div>
          <div className="recheck-progress">
            <div>
              <span>스캔 대상</span>
              <b>{recheckReport.componentCount}개 구성요소</b>
              <small>SBOM 재수집 완료</small>
            </div>
            <div>
              <span>취약 버전 확인</span>
              <b>분석 중</b>
              <small>{item.package} 안전 버전 검증</small>
            </div>
            <div>
              <span>신규 CVE 매칭</span>
              <b>진행 중</b>
              <small>OSV · NVD · KEV 재조회</small>
            </div>
            <div>
              <span>보고서 생성</span>
              <b>v{recheckReport.version}</b>
              <small>{recheckReport.createdAt}</small>
            </div>
          </div>
          <div className="recheck-steps">
            <span className="done">
              <Icon name="check" size={12} /> SBOM 재수집
            </span>
            <i />
            <span className="active">
              <Icon name="sparkle" size={12} /> 취약점 재매칭
            </span>
            <i />
            <span>해소 여부 판정</span>
            <i />
            <span>보고서 확정</span>
          </div>
        </section>
      )}

      <div className="report-columns">
        <section className="report-section">
          <div className="report-section-title">
            <div>
              <span className="section-number">01</span>
              <div>
                <b>영향 및 근거 분석</b>
                <small>AI가 수집한 취약점 맥락</small>
              </div>
            </div>
            <span className="confidence">신뢰도 94%</span>
          </div>
          <div className="analysis-summary">
            <p>
              현재 운영 중인 <b>{item.service}</b>에서 취약한{" "}
              <b>
                {item.package} {item.version}
              </b>
              이 확인되었습니다. 공격 성공 시 서비스 권한으로 임의 코드 실행 및 데이터 접근이
              가능합니다.
            </p>
          </div>
          <div className="evidence-table">
            <div>
              <span>OSV / NVD</span>
              <b>패키지 및 버전 일치</b>
              <i>확인</i>
            </div>
            <div>
              <span>KEV / EPSS</span>
              <b>{item.kev ? "실제 악용 사례 확인" : "악용 가능성 상위 5%"}</b>
              <i>확인</i>
            </div>
            <div>
              <span>내부 자산</span>
              <b>운영 환경 3개 인스턴스 영향</b>
              <i>확인</i>
            </div>
            <div>
              <span>네트워크</span>
              <b>외부 인터넷 경로 노출</b>
              <i>확인</i>
            </div>
          </div>
          <div className="source-links">
            <b>참조 근거</b>
            <button onClick={() => setActiveEvidence("advisory")}>
              {item.cve} 공식 권고문 <Icon name="link" size={12} />
            </button>
            <button onClick={() => setActiveEvidence("vendor")}>
              공급사 보안 게시판 <Icon name="link" size={12} />
            </button>
          </div>
          {activeEvidence && (
            <div className="evidence-preview">
              <div className="evidence-preview-header">
                <div>
                  <span>REFERENCE PREVIEW</span>
                  <b>{evidence.label}</b>
                </div>
                <button onClick={() => setActiveEvidence(null)} aria-label="근거 미리보기 닫기">
                  <Icon name="close" size={14} />
                </button>
              </div>
              <div className="evidence-preview-source">
                <span className="source-seal">
                  <Icon name="shield" size={15} />
                </span>
                <div>
                  <b>{evidence.source}</b>
                  <small>검증된 외부 보안 데이터 소스</small>
                </div>
                <span className="verified-source">
                  <Icon name="check" size={11} /> 검증됨
                </span>
              </div>
              <p>{evidence.summary}</p>
              <dl>
                <div>
                  <dt>영향 범위</dt>
                  <dd>{evidence.scope}</dd>
                </div>
                <div>
                  <dt>게시일</dt>
                  <dd>{evidence.published}</dd>
                </div>
                <div>
                  <dt>수집 방식</dt>
                  <dd>MCP 자동 수집</dd>
                </div>
              </dl>
              <a href={evidence.href} target="_blank" rel="noreferrer">
                원문 새 창에서 보기 <Icon name="arrow" size={12} />
              </a>
            </div>
          )}
        </section>

        <section className="report-section action-plan">
          <div className="report-section-title">
            <div>
              <span className="section-number ai-number">
                <Icon name="sparkle" size={14} />
              </span>
              <div>
                <b>AI 조치 계획</b>
                <small>MCP 도구 검증 완료</small>
              </div>
            </div>
            <span className="validated">
              <Icon name="check" size={12} /> 형식 검증
            </span>
          </div>
          <div className="plan-block">
            <span>권장 조치</span>
            <h3>{item.package} 패키지를 안전 버전으로 업데이트</h3>
            <div className="report-code">
              <small>package manifest</small>
              <span>
                - {item.package}@{item.version}
              </span>
              <b>+ {item.package}@latest-stable</b>
            </div>
          </div>
          <div className="plan-steps">
            {[
              ["1", "스테이징 적용", "패키지 업데이트 후 빌드 및 회귀 테스트"],
              ["2", "운영 배포", "카나리 10% 배포 후 오류율 15분 관찰"],
              ["3", "재검증", "SBOM 재생성 및 취약 버전 미탐지 확인"],
            ].map(([number, title, detail]) => (
              <div key={number}>
                <span>{number}</span>
                <p>
                  <b>{title}</b>
                  <small>{detail}</small>
                </p>
              </div>
            ))}
          </div>
          <div className="rollback">
            <Icon name="clock" size={15} />
            <div>
              <b>롤백 계획 포함</b>
              <span>오류율 1% 초과 시 이전 이미지로 자동 복구</span>
            </div>
          </div>
        </section>
      </div>

      <section className="report-approval">
        {verificationRequested ? (
          <div className="report-verification">
            <span>
              <Icon name="shield" />
            </span>
            <div>
              <b>재검증이 요청되었습니다</b>
              <small>SBOM 재수집과 취약 버전 미탐지 여부를 확인하고 있습니다.</small>
            </div>
          </div>
        ) : approved ? (
          <>
            <div className="report-approved">
              <span>
                <Icon name="check" />
              </span>
              <div>
                <b>조치안이 승인되었습니다</b>
                <small>조치 티켓이 생성되었으며 적용 단계가 시작되었습니다.</small>
              </div>
            </div>
            <div className="approved-actions">
              <button className="primary" onClick={onRequestVerification}>
                <Icon name="shield" size={14} /> 적용 완료 · 재검증 요청
              </button>
              <button
                className="secondary"
                disabled={!canCancelApproval}
                onClick={onCancelApproval}
              >
                승인 취소
              </button>
              {!canCancelApproval && <small>{item.owner} 담당자만 취소할 수 있습니다.</small>}
            </div>
          </>
        ) : correctionRequested ? (
          <div className="report-correction">
            <span>
              <Icon name="clock" />
            </span>
            <div>
              <b>조치안 보완 요청이 전송되었습니다</b>
              <small>승인 전 조치 근거와 실행 계획을 다시 작성하고 있습니다.</small>
            </div>
          </div>
        ) : (
          <>
            <div>
              <b>담당자 승인</b>
              <span>승인 내역은 변경 불가능한 감사 로그에 기록됩니다.</span>
            </div>
            <div className="report-approval-actions">
              <button className="secondary" onClick={onRequestCorrection}>
                <Icon name="close" size={15} /> 조치안 보완 요청
              </button>
              <button className="primary" onClick={onApprove}>
                <Icon name="check" size={15} /> 승인 및 적용
              </button>
            </div>
          </>
        )}
      </section>

      {showPrintSelector && (
        <div className="modal-backdrop">
          <form
            className="export-dialog"
            onSubmit={(event) => {
              event.preventDefault();
              setShowPrintSelector(false);
              printVulnerabilityReport(
                selectedPrintOption === "initial"
                  ? 1
                  : selectedPrintOption === "recheck"
                    ? (recheckReport?.version ?? 2)
                    : "both",
              );
            }}
          >
            <div className="sbom-creator-header">
              <div>
                <span>SELECT REPORT</span>
                <h2>보고서 출력</h2>
                <p>출력할 취약점 보고서를 선택해주세요.</p>
              </div>
              <button type="button" onClick={() => setShowPrintSelector(false)} aria-label="닫기">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="report-options">
              <label className={selectedPrintOption === "initial" ? "selected" : ""}>
                <input
                  type="radio"
                  name="print-report"
                  checked={selectedPrintOption === "initial"}
                  onChange={() => setSelectedPrintOption("initial")}
                />
                <span>
                  <Icon name="report" size={17} />
                </span>
                <div>
                  <b>기존 보고서</b>
                  <small>최초 위험 분석과 AI 조치 계획</small>
                </div>
                <i>{selectedPrintOption === "initial" && <Icon name="check" size={12} />}</i>
              </label>
              {recheckReport && (
                <>
                  <label className={selectedPrintOption === "recheck" ? "selected" : ""}>
                    <input
                      type="radio"
                      name="print-report"
                      checked={selectedPrintOption === "recheck"}
                      onChange={() => setSelectedPrintOption("recheck")}
                    />
                    <span>
                      <Icon name="shield" size={17} />
                    </span>
                    <div>
                      <b>재검증 보고서</b>
                      <small>재수집 SBOM과 재검증 결과</small>
                    </div>
                    <i>{selectedPrintOption === "recheck" && <Icon name="check" size={12} />}</i>
                  </label>
                  <label className={selectedPrintOption === "both" ? "selected" : ""}>
                    <input
                      type="radio"
                      name="print-report"
                      checked={selectedPrintOption === "both"}
                      onChange={() => setSelectedPrintOption("both")}
                    />
                    <span>
                      <Icon name="box" size={17} />
                    </span>
                    <div>
                      <b>기존 + 재검증 보고서</b>
                      <small>두 보고서를 각각 별도 페이지로 출력</small>
                    </div>
                    <i>{selectedPrintOption === "both" && <Icon name="check" size={12} />}</i>
                  </label>
                </>
              )}
            </div>
            <div className="sbom-creator-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowPrintSelector(false)}
              >
                취소
              </button>
              <button type="submit" className="primary">
                <Icon name="report" size={15} /> 선택한 보고서 출력
              </button>
            </div>
          </form>
        </div>
      )}

      {printVersion && (
        <section className="print-sheet vulnerability-print">
          {versionsToPrint.map((version, index) => (
            <div className={`print-report-page ${index > 0 ? "new-page" : ""}`} key={version}>
              <header>
                <div>
                  <b>SENTRA</b>
                  <span>VULNERABILITY REMEDIATION REPORT</span>
                </div>
                <small>출력일 {new Date().toLocaleDateString("ko-KR")}</small>
              </header>
              <div className="print-version">REPORT VERSION · v{version}</div>
              <h1>{version === 1 ? "초기 취약점 보고서" : "재검증 취약점 보고서"}</h1>
              <p>
                {item.cve} · {item.title}
              </p>
              <div className="print-metrics">
                <div>
                  <span>위험도</span>
                  <b>{item.risk}</b>
                </div>
                <div>
                  <span>CVSS</span>
                  <b>{item.score / 10}</b>
                </div>
                <div>
                  <span>영향 서비스</span>
                  <b>{item.service}</b>
                </div>
                <div>
                  <span>조치 기한</span>
                  <b>D-{Math.max(0, getDaysLeft(deadline))}</b>
                </div>
              </div>
              <h2>취약점 기준 정보</h2>
              <table>
                <tbody>
                  <tr>
                    <th>CVE</th>
                    <td>{item.cve}</td>
                    <th>보고서 버전</th>
                    <td>v{version}</td>
                  </tr>
                  <tr>
                    <th>취약 구성요소</th>
                    <td>
                      {item.package} {item.version}
                    </td>
                    <th>담당자</th>
                    <td>{item.owner}</td>
                  </tr>
                  <tr>
                    <th>영향 서비스</th>
                    <td>{item.service}</td>
                    <th>조치 기한</th>
                    <td>{formatDeadline(deadline)}</td>
                  </tr>
                  <tr>
                    <th>악용 근거</th>
                    <td>{item.kev ? "CISA KEV 등재" : "공개 권고문"}</td>
                    <th>현재 상태</th>
                    <td>
                      {getEffectiveStatus(
                        item,
                        deadline,
                        approved,
                        correctionRequested,
                        verificationRequested,
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
              <h2>{version === 1 ? "AI 조치 계획" : "재검증 결과"}</h2>
              <table>
                <tbody>
                  {version === 1 ? (
                    <>
                      <tr>
                        <th>권장 조치</th>
                        <td colSpan={3}>{item.package} 안전 버전 업데이트</td>
                      </tr>
                      <tr>
                        <th>검증 절차</th>
                        <td colSpan={3}>스테이징 적용 → 운영 배포 → SBOM 재수집</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <th>스캔 대상</th>
                        <td>{recheckReport?.componentCount ?? 0}개</td>
                        <th>SBOM</th>
                        <td>재수집 완료</td>
                      </tr>
                      <tr>
                        <th>취약 버전</th>
                        <td>재분석 중</td>
                        <th>신규 CVE</th>
                        <td>OSV·NVD·KEV 재매칭</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
              <footer>본 보고서는 SENTRA에서 생성되었으며 감사 이력과 함께 보관됩니다.</footer>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default function App() {
  const [filter, setFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState<Page>("dashboard");
  const [queueView, setQueueView] = useState<QueueView>("list");
  const [showPipeline, setShowPipeline] = useState(false);
  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [correctionIds, setCorrectionIds] = useState<string[]>([]);
  const [verificationIds, setVerificationIds] = useState<string[]>([]);
  const [recheckReports, setRecheckReports] = useState<RecheckReport[]>([]);
  const [archivedReports, setArchivedReports] = useState<ArchivedReport[]>([]);
  const [deadlines, setDeadlines] = useState<Record<string, string>>(initialDeadlines);
  const [audits, setAudits] = useState<
    Array<{ id: string; title: string; detail: string; time: string }>
  >([]);

  const visible = useMemo(
    () =>
      vulnerabilities.filter((item) => {
        const effectiveStatus = getEffectiveStatus(
          item,
          deadlines[item.id],
          approvedIds.includes(item.id),
          correctionIds.includes(item.id),
          verificationIds.includes(item.id),
        );
        const matchesFilter =
          filter === "전체" ||
          (filter === "긴급" && item.risk === "긴급") ||
          (filter === "승인 대기" && effectiveStatus === "승인 대기");
        const term = search.toLowerCase();
        return (
          matchesFilter &&
          (item.cve.toLowerCase().includes(term) ||
            item.title.toLowerCase().includes(term) ||
            item.service.toLowerCase().includes(term))
        );
      }),
    [approvedIds, correctionIds, deadlines, filter, search, verificationIds],
  );

  const selectItem = (id: string) => {
    setOpenReportId(id);
  };

  const openReport = vulnerabilities.find((item) => item.id === openReportId);
  const navigate = (target: Page) => {
    setOpenReportId(null);
    setPage(target);
  };

  return (
    <div className="product">
      <aside className="sidebar">
        <button className="logo" onClick={() => navigate("dashboard")} aria-label="Sentra home">
          <span>
            <Icon name="shield" size={19} />
          </span>
          <b>SENTRA</b>
        </button>

        <nav>
          <p>WORKSPACE</p>
          <button
            className={page === "dashboard" ? "active" : ""}
            onClick={() => navigate("dashboard")}
          >
            <Icon name="grid" />
            대시보드
          </button>
          <button
            className={page === "vulnerabilities" ? "active" : ""}
            onClick={() => navigate("vulnerabilities")}
          >
            <Icon name="shield" />
            취약점 관리<span className="nav-count">12</span>
          </button>
          <button className={page === "assets" ? "active" : ""} onClick={() => navigate("assets")}>
            <Icon name="box" />
            SBOM 자산
          </button>
          <button
            className={page === "tickets" ? "active" : ""}
            onClick={() => navigate("tickets")}
          >
            <Icon name="ticket" />
            조치 티켓<span className="nav-count muted">8</span>
          </button>
          <p>INSIGHTS</p>
          <button
            className={page === "reports" ? "active" : ""}
            onClick={() => navigate("reports")}
          >
            <Icon name="report" />
            감사 및 보고서
          </button>
        </nav>

        <div className="sidebar-bottom">
          <a href="#">
            <Icon name="settings" />
            설정
          </a>
          <div className="user-card">
            <span className="avatar">윤</span>
            <div>
              <b>윤예린</b>
              <small>Security Admin</small>
            </div>
            <Icon name="more" />
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="header">
          <div className="crumb">
            <span>보안 운영</span>
            <Icon name="arrow" size={14} />
            <b>
              {openReport
                ? "취약점 대응"
                : page === "dashboard"
                  ? "취약점 대응"
                  : page === "vulnerabilities"
                    ? "취약점 관리"
                    : page === "assets"
                      ? "SBOM 자산"
                      : page === "tickets"
                        ? "조치 티켓"
                        : "감사 및 보고서"}
            </b>
          </div>
          <div className="header-actions">
            <label className="global-search">
              <Icon name="search" size={17} />
              <input placeholder="CVE, 패키지, 서비스 검색" />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button notification" aria-label="알림">
              <Icon name="bell" />
            </button>
          </div>
        </header>

        <main className="content">
          {openReport ? (
            <VulnerabilityReport
              item={openReport}
              deadline={deadlines[openReport.id]}
              approved={approvedIds.includes(openReport.id)}
              correctionRequested={correctionIds.includes(openReport.id)}
              verificationRequested={verificationIds.includes(openReport.id)}
              canCancelApproval={openReport.owner === "윤예린"}
              recheckReport={recheckReports.find(
                (report) => report.vulnerabilityId === openReport.id,
              )}
              onExit={() => {
                setOpenReportId(null);
                setPage("vulnerabilities");
              }}
              onApprove={() => {
                setCorrectionIds((current) => current.filter((id) => id !== openReport.id));
                setVerificationIds((current) => current.filter((id) => id !== openReport.id));
                setApprovedIds((current) =>
                  current.includes(openReport.id) ? current : [...current, openReport.id],
                );
                if (!audits.some((entry) => entry.id === openReport.id)) {
                  setAudits((current) => [
                    {
                      id: openReport.id,
                      title: "AI 조치안 승인 및 적용 시작",
                      detail: `${openReport.cve} · ${openReport.service} · ${openReport.package} 안전 버전 업데이트 승인`,
                      time: "방금 전",
                    },
                    ...current,
                  ]);
                }
              }}
              onRequestCorrection={() => {
                setCorrectionIds((current) =>
                  current.includes(openReport.id) ? current : [...current, openReport.id],
                );
                setAudits((current) => [
                  {
                    id: `correction-${openReport.id}-${Date.now()}`,
                    title: "AI 조치안 보완 요청",
                    detail: `${openReport.cve} · 근거와 실행 계획 재작성 요청`,
                    time: "방금 전",
                  },
                  ...current,
                ]);
              }}
              onRequestVerification={() => {
                setVerificationIds((current) =>
                  current.includes(openReport.id) ? current : [...current, openReport.id],
                );
                setAudits((current) => [
                  {
                    id: `verification-${openReport.id}-${Date.now()}`,
                    title: "적용 완료 및 재검증 요청",
                    detail: `${openReport.cve} · SBOM 재수집과 취약점 해소 확인 시작`,
                    time: "방금 전",
                  },
                  {
                    id: `archive-${openReport.id}-${Date.now()}`,
                    title: "재검증 이전 보고서 보관",
                    detail: `${openReport.cve} · 취약점 보고서 v1 감사 보관소 저장`,
                    time: "방금 전",
                  },
                  ...current,
                ]);
                setRecheckReports((current) => {
                  if (current.some((report) => report.vulnerabilityId === openReport.id)) {
                    return current;
                  }
                  return [
                    {
                      vulnerabilityId: openReport.id,
                      version: 2,
                      createdAt: new Date().toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      componentCount: openReport.id === "VUL-2419" ? 328 : 214,
                    },
                    ...current,
                  ];
                });
                setArchivedReports((current) => {
                  if (current.some((report) => report.vulnerabilityId === openReport.id)) {
                    return current;
                  }
                  return [
                    {
                      id: `archive-${openReport.id}-v1`,
                      vulnerabilityId: openReport.id,
                      cve: openReport.cve,
                      title: openReport.title,
                      version: 1,
                      archivedAt: new Date().toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      owner: openReport.owner,
                    },
                    ...current,
                  ];
                });
              }}
              onCancelApproval={() => {
                if (openReport.owner !== "윤예린") return;
                setApprovedIds((current) => current.filter((id) => id !== openReport.id));
                setVerificationIds((current) => current.filter((id) => id !== openReport.id));
                setRecheckReports((current) =>
                  current.filter((report) => report.vulnerabilityId !== openReport.id),
                );
                setAudits((current) => [
                  {
                    id: `cancel-${openReport.id}-${Date.now()}`,
                    title: "조치안 승인 취소",
                    detail: `${openReport.cve} · 담당자 ${openReport.owner} 승인 취소`,
                    time: "방금 전",
                  },
                  ...current,
                ]);
              }}
            />
          ) : page === "dashboard" ? (
            <>
              <section className="page-heading">
                <div>
                  <p className="eyebrow">VULNERABILITY OPERATIONS</p>
                  <h1>취약점 대응 센터</h1>
                  <span>SBOM 자산부터 조치 완료까지, 근거 기반으로 관리하세요.</span>
                </div>
                <div className="sync-state">
                  <i />
                  <div>
                    <b>SBOM 동기화 완료</b>
                    <span>오늘 09:42 · 1,284개 구성요소</span>
                  </div>
                </div>
              </section>

              <section className="metrics">
                <article>
                  <div className="metric-label">
                    <span className="metric-icon urgent">
                      <Icon name="shield" />
                    </span>
                    긴급 취약점
                  </div>
                  <div className="metric-value">
                    <b>12</b>
                    <span className="up">+3</span>
                  </div>
                  <p>24시간 내 조치 필요</p>
                </article>
                <article>
                  <div className="metric-label">
                    <span className="metric-icon ai">
                      <Icon name="sparkle" />
                    </span>
                    AI 분석 중
                  </div>
                  <div className="metric-value">
                    <b>27</b>
                    <span>실시간</span>
                  </div>
                  <p>근거 및 패치안 생성</p>
                </article>
                <article>
                  <div className="metric-label">
                    <span className="metric-icon waiting">
                      <Icon name="clock" />
                    </span>
                    승인 대기
                  </div>
                  <div className="metric-value">
                    <b>{Math.max(0, 8 - approvedIds.length)}</b>
                    <span className="warn">{Math.max(0, 2 - approvedIds.length)}건 임박</span>
                  </div>
                  <p>담당자 검토가 필요합니다</p>
                </article>
                <article>
                  <div className="metric-label">
                    <span className="metric-icon done">
                      <Icon name="check" />
                    </span>
                    이번 달 종결
                  </div>
                  <div className="metric-value">
                    <b>143</b>
                    <span className="success">92%</span>
                  </div>
                  <p>평균 조치 시간 3.2일</p>
                </article>
              </section>

              <section className="pipeline-card">
                <div className="pipeline-title">
                  <div>
                    <b>대응 파이프라인</b>
                    <span>현재 워크플로 상태</span>
                  </div>
                  <button onClick={() => setShowPipeline(true)}>
                    전체 흐름 보기 <Icon name="arrow" size={14} />
                  </button>
                </div>
                <div className="pipeline">
                  {[
                    ["01", "수집·품질 검사", "1,284", "done"],
                    ["02", "취약점 매칭", "214", "done"],
                    ["03", "맥락 보강", "67", "active"],
                    ["04", "우선순위", "47", "active"],
                    ["05", "AI 조치안", "27", "current"],
                    ["06", "담당자 승인", String(Math.max(0, 8 - approvedIds.length)), "waiting"],
                    ["07", "적용·종결", "143", ""],
                  ].map(([number, label, count, state], index) => (
                    <div className={`pipeline-step ${state}`} key={number}>
                      <div className="pipeline-node">
                        {state === "done" ? <Icon name="check" size={14} /> : number}
                      </div>
                      <div>
                        <b>{label}</b>
                        <span>{count}건</span>
                      </div>
                      {index < 6 && <i className="pipeline-line" />}
                    </div>
                  ))}
                </div>
              </section>

              {showPipeline && (
                <div className="modal-backdrop">
                  <div className="pipeline-modal">
                    <div className="sbom-creator-header">
                      <div>
                        <span>END-TO-END WORKFLOW</span>
                        <h2>SBOM 취약점 대응 전체 흐름</h2>
                        <p>수집부터 사람 승인, 재검증과 종결까지의 운영 단계입니다.</p>
                      </div>
                      <button onClick={() => setShowPipeline(false)} aria-label="닫기">
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                    <div className="full-pipeline">
                      {[
                        [
                          "01",
                          "수집·품질 검사",
                          "CI/CD와 스캔에서 SBOM을 수집하고 식별자·의존 관계를 검증합니다.",
                        ],
                        [
                          "02",
                          "취약점 매칭",
                          "OSV, NVD, GitHub Advisory와 구성요소 버전을 매칭합니다.",
                        ],
                        ["03", "맥락 보강", "KEV·EPSS, 인터넷 노출과 실제 악용 여부를 결합합니다."],
                        [
                          "04",
                          "우선순위 결정",
                          "위험도와 업무 중요도에 따라 24시간·7일·30일 SLA를 배정합니다.",
                        ],
                        [
                          "05",
                          "AI 조치안 생성",
                          "MCP 도구로 호환성을 검증하고 패치·롤백 계획을 작성합니다.",
                        ],
                        [
                          "06",
                          "담당자 승인·적용",
                          "담당자가 근거를 검토하고 승인한 조치안을 운영 환경에 적용합니다.",
                        ],
                        [
                          "07",
                          "재검증·종결",
                          "SBOM을 다시 수집해 해소 여부를 확인하고 감사 보고서를 보관합니다.",
                        ],
                      ].map(([number, title, description], index) => (
                        <article key={number}>
                          <div className="full-pipeline-number">{number}</div>
                          <div>
                            <b>{title}</b>
                            <p>{description}</p>
                          </div>
                          {index < 6 && <i />}
                        </article>
                      ))}
                    </div>
                    <div className="pipeline-note">
                      <Icon name="shield" size={17} />
                      <p>
                        <b>사람 중심 승인 원칙</b>
                        <span>
                          AI는 조치안을 제안하지만 실제 적용과 종결은 담당자 승인 및 재검증 후에만
                          진행됩니다.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <section className="work-area">
                <div className="queue-card">
                  <div className="queue-header">
                    <div>
                      <h2>조치 우선순위</h2>
                      <span>총 47건</span>
                    </div>
                    <div className="queue-actions">
                      <div className="view-toggle">
                        <button
                          className={queueView === "list" ? "active" : ""}
                          onClick={() => setQueueView("list")}
                        >
                          <Icon name="report" size={14} /> 리스트
                        </button>
                        <button
                          className={queueView === "calendar" ? "active" : ""}
                          onClick={() => setQueueView("calendar")}
                        >
                          <Icon name="grid" size={14} /> 달력
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="table-tools">
                    <div className="priority-filters">
                      <div className="tabs">
                        {["전체", "긴급", "승인 대기"].map((item) => (
                          <button
                            className={filter === item ? "active" : ""}
                            onClick={() => setFilter(item)}
                            key={item}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="table-search">
                      <Icon name="search" size={15} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="목록 검색"
                      />
                    </label>
                  </div>
                  {queueView === "list" ? (
                    <div className="vulnerability-list">
                      <div className="list-head">
                        <span>취약점</span>
                        <span>위험도</span>
                        <span>상태</span>
                        <span>담당자 / SLA</span>
                      </div>
                      {[
                        {
                          label: "내 담당 취약점",
                          description: "현재 로그인 계정 · 윤예린",
                          items: visible.filter((item) => item.owner === "윤예린"),
                          mine: true,
                        },
                        {
                          label: "다른 담당자 취약점",
                          description: "협업 중인 보안·개발 담당자",
                          items: visible.filter((item) => item.owner !== "윤예린"),
                          mine: false,
                        },
                      ].map((group) => (
                        <div className="priority-group" key={group.label}>
                          <div className={`priority-group-title ${group.mine ? "mine" : ""}`}>
                            <div>
                              <b>{group.label}</b>
                              <span>{group.description}</span>
                            </div>
                            <strong>{group.items.length}건</strong>
                          </div>
                          {group.items.map((item) => (
                            <button
                              className="vulnerability-row"
                              onClick={() => selectItem(item.id)}
                              key={item.id}
                            >
                              <div className="vuln-main">
                                <div>
                                  <b>{item.cve}</b>
                                  {item.kev && <span className="kev">KEV</span>}
                                  {recheckReports.some(
                                    (report) => report.vulnerabilityId === item.id,
                                  ) && <span className="report-version-badge">v2 재검증</span>}
                                </div>
                                <strong>{item.title}</strong>
                                <small>
                                  {item.service} · {item.package} {item.version}
                                </small>
                              </div>
                              <div className="risk-cell">
                                <RiskBadge risk={item.risk} />
                                <small>점수 {item.score}</small>
                              </div>
                              <StatusBadge
                                status={getEffectiveStatus(
                                  item,
                                  deadlines[item.id],
                                  approvedIds.includes(item.id),
                                  correctionIds.includes(item.id),
                                  verificationIds.includes(item.id),
                                )}
                              />
                              <div className="owner-cell">
                                <span className="avatar small">{item.initials}</span>
                                <div>
                                  <b>{item.owner}</b>
                                  <small className={item.risk === "긴급" ? "deadline" : ""}>
                                    {item.due}
                                  </small>
                                </div>
                              </div>
                            </button>
                          ))}
                          {group.items.length === 0 && (
                            <div className="group-empty">해당하는 취약점이 없습니다.</div>
                          )}
                        </div>
                      ))}
                      {visible.length === 0 && <div className="empty">검색 결과가 없습니다.</div>}
                    </div>
                  ) : (
                    <CalendarView
                      items={visible}
                      onSelect={selectItem}
                      recheckIds={recheckReports.map((report) => report.vulnerabilityId)}
                    />
                  )}
                </div>
              </section>
            </>
          ) : (
            <SectionPage
              page={page}
              audits={audits}
              onOpenReport={selectItem}
              approvedIds={approvedIds}
              correctionIds={correctionIds}
              verificationIds={verificationIds}
              recheckReports={recheckReports}
              archivedReports={archivedReports}
              deadlines={deadlines}
              onDeadlineChange={(id, deadline) =>
                setDeadlines((current) => ({ ...current, [id]: deadline }))
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}
