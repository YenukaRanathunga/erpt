"use client";

import React, { useState, useEffect } from "react";

export type SupportTicket = {
  id: string;
  category: string;
  priority: "normal" | "urgent" | "emergency";
  relatedRequestId?: string;
  subject: string;
  message: string;
  contactPhone?: string;
  requesterName: string;
  requesterOffice: string;
  createdAt: string;
  status: "Under Review" | "Assigned to Fleet Admin" | "Resolved";
};

const defaultSupportTickets: SupportTicket[] = [
  {
    id: "TKT-260814-001",
    category: "Booking Amendment / Reschedule",
    priority: "normal",
    relatedRequestId: "VR-260814-039",
    subject: "Departure time adjustment for Badulla trip",
    message: "Requesting to adjust departure time from 06:30 to 07:15 AM to coordinate with project field officers arriving from Bandarawela.",
    contactPhone: "+94 77 123 4567",
    requesterName: "Dilum Sanjeewa",
    requesterOffice: "Batticaloa Area Office",
    createdAt: "14 Aug 2026, 09:15 AM",
    status: "Assigned to Fleet Admin"
  }
];

type HelpTab = "guide" | "workflow" | "safety" | "ticket" | "contacts";

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRequest: () => void;
  currentUser: string;
  currentRole: string;
  currentOffice: string;
  onAnnounce: (msg: string) => void;
}

export default function HelpGuideModal({
  isOpen,
  onClose,
  onNavigateToRequest,
  currentUser,
  currentRole,
  currentOffice,
  onAnnounce,
}: HelpGuideModalProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>("guide");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Support ticket form state
  const [ticketCategory, setTicketCategory] = useState("Urgent Transport Assistance");
  const [ticketPriority, setTicketPriority] = useState<"normal" | "urgent" | "emergency">("normal");
  const [relatedReqId, setRelatedReqId] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketPhone, setTicketPhone] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState("");

  // Load saved tickets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("chrysalis_helpdesk_tickets");
      if (saved) {
        setTickets(JSON.parse(saved) as SupportTicket[]);
      } else {
        setTickets(defaultSupportTickets);
      }
    } catch {
      setTickets(defaultSupportTickets);
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      onAnnounce("Please enter both a subject and a message description.");
      return;
    }

    const now = new Date();
    const dateCode = String(now.getDate()).padStart(2, "0") + String(now.getMonth() + 1).padStart(2, "0") + String(now.getFullYear()).slice(-2);
    const randomSuffix = String(Math.floor(100 + Math.random() * 900));
    const newId = "TKT-" + dateCode + "-" + randomSuffix;

    const newTicket: SupportTicket = {
      id: newId,
      category: ticketCategory,
      priority: ticketPriority,
      relatedRequestId: relatedReqId.trim() || undefined,
      subject: ticketSubject.trim(),
      message: ticketMessage.trim(),
      contactPhone: ticketPhone.trim() || undefined,
      requesterName: currentUser,
      requesterOffice: currentOffice,
      createdAt: now.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Under Review"
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    try {
      localStorage.setItem("chrysalis_helpdesk_tickets", JSON.stringify(updated));
    } catch {
      // ignore
    }

    setLastSubmittedId(newId);
    setTicketSubmitted(true);
    setTicketSubject("");
    setTicketMessage("");
    setRelatedReqId("");
    setTicketPhone("");
    onAnnounce("Helpdesk ticket " + newId + " submitted to the Operations Desk.");
  };

  return (
    <div className="help-modal-backdrop" onClick={onClose} role="presentation">
      <section
        className="help-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Operations Guide and Support Desk"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="help-modal-header">
          <div className="help-modal-title-wrap">
            <span className="help-eyebrow">CHRYALIS MOBILITY OPERATIONS MANUAL &amp; HELPDESK</span>
            <h2>Operations Guide &amp; Support Desk</h2>
            <p>
              Requisition guidelines, approval routing rules, safety policies, and direct assistance ticketing.
            </p>
          </div>
          <button
            type="button"
            className="help-modal-close"
            onClick={onClose}
            aria-label="Close operations guide"
          >
            ×
          </button>
        </header>

        {/* Tab Navigation */}
        <nav className="help-modal-tabs" aria-label="Operations Guide Navigation">
          <button
            type="button"
            className={activeTab === "guide" ? "active" : ""}
            onClick={() => setActiveTab("guide")}
          >
            How to Request Transport
          </button>
          <button
            type="button"
            className={activeTab === "workflow" ? "active" : ""}
            onClick={() => setActiveTab("workflow")}
          >
            Approval Workflow &amp; Rules
          </button>
          <button
            type="button"
            className={activeTab === "safety" ? "active" : ""}
            onClick={() => setActiveTab("safety")}
          >
            Fleet Rules &amp; Protocol
          </button>
          <button
            type="button"
            className={activeTab === "ticket" ? "active" : ""}
            onClick={() => setActiveTab("ticket")}
          >
            Submit Support Ticket
            {tickets.length > 0 && <span className="tab-count">{tickets.length}</span>}
          </button>
          <button
            type="button"
            className={activeTab === "contacts" ? "active" : ""}
            onClick={() => setActiveTab("contacts")}
          >
            Helplines &amp; Desks
          </button>
        </nav>

        {/* Body Content */}
        <div className="help-modal-body">
          {/* TAB 1: HOW TO REQUEST TRANSPORT */}
          {activeTab === "guide" && (
            <div className="help-tab-pane">
              <div className="help-intro-card">
                <div>
                  <span className="help-tag">STANDARD OPERATING PROCEDURE</span>
                  <h3>How to Submit a Vehicle Requisition</h3>
                  <p>
                    All Chrysalis staff, project teams, and consultants requiring mobility for field activities, donor monitoring, or inter-office transport must submit an electronic Vehicle Requisition. Follow the 4 key steps below:
                  </p>
                </div>
                <button
                  type="button"
                  className="help-cta-btn"
                  onClick={onNavigateToRequest}
                >
                  Start New Request Now →
                </button>
              </div>

              <div className="help-steps-grid">
                {/* Step 1 */}
                <div className="help-step-box">
                  <div className="help-step-header">
                    <span className="help-step-badge">STEP 01</span>
                    <h4>Journey &amp; Route Planning</h4>
                  </div>
                  <ul className="help-step-list">
                    <li>
                      <strong>Base Office:</strong> Select your operating office (Colombo Head Office, Batticaloa, Jaffna, Matara, Galle, Nuwara Eliya).
                    </li>
                    <li>
                      <strong>Travel Dates &amp; Times:</strong> Enter departure date/time and expected return date/time accurately for driver scheduling.
                    </li>
                    <li>
                      <strong>Origin &amp; Destination:</strong> Enter pickup location and final destination.
                    </li>
                    <li>
                      <strong>Multi-Stop Itineraries:</strong> If visiting intermediate project sites, click <em>&ldquo;+ Add another stop&rdquo;</em> to log each stop in sequential order.
                    </li>
                    <li>
                      <strong>Operational Purpose:</strong> Provide a concise operational justification (e.g., <em>&ldquo;Procurement-related works and staff capacity building&rdquo;</em>).
                    </li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div className="help-step-box">
                  <div className="help-step-header">
                    <span className="help-step-badge">STEP 02</span>
                    <h4>Passenger Roster &amp; Capacity</h4>
                  </div>
                  <ul className="help-step-list">
                    <li>
                      <strong>Primary Requester:</strong> You are automatically registered as the primary traveller.
                    </li>
                    <li>
                      <strong>Staff Directory Search:</strong> Click <em>&ldquo;+ Add passenger&rdquo;</em> to search fellow team members by Name, EMP Number, Position, or Office.
                    </li>
                    <li>
                      <strong>Consultants / Partners:</strong> For external persons, use <em>&ldquo;Other passenger / Consultant&rdquo;</em> and enter their full name.
                    </li>
                    <li>
                      <strong>Fleet Seating Limits:</strong>
                      <div className="help-subspecs">
                        <span>Sedan: Max 3 staff + driver</span>
                        <span>Double Cab / 4WD: Max 4 staff + driver</span>
                        <span>Passenger Van: Max 8&ndash;10 staff + driver</span>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="help-step-box">
                  <div className="help-step-header">
                    <span className="help-step-badge">STEP 03</span>
                    <h4>Budget Codes &amp; Cost Center</h4>
                  </div>
                  <ul className="help-step-list">
                    <li>
                      <strong>Project Activity Code:</strong> Enter the donor or project budget line (e.g. <code>COPEJW602162</code>).
                    </li>
                    <li>
                      <strong>Shared Cost Splitting:</strong> If travel expenses are shared among multiple projects, click <em>&ldquo;+ Add another budget code&rdquo;</em>.
                    </li>
                    <li>
                      <strong>Central &ldquo;CHR&rdquo; Budgets:</strong> Any requisition billed under core <code>CHR</code> organizational codes automatically escalates to the Chief Executive Officer for financial clearance.
                    </li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div className="help-step-box">
                  <div className="help-step-header">
                    <span className="help-step-badge">STEP 04</span>
                    <h4>Approver Selection &amp; Submission</h4>
                  </div>
                  <ul className="help-step-list">
                    <li>
                      <strong>Approver Directory:</strong> Search and select your assigned Project Manager, Project Director, or Head of Department.
                    </li>
                    <li>
                      <strong>Advance Notice Timeline:</strong> Routine field travel requires a minimum of <strong>3 working days (72 hours)</strong> prior notice.
                    </li>
                    <li>
                      <strong>Tracking Your Request:</strong> Once submitted, monitor authorization status via the <em>Calendar</em> and <em>Dashboard</em>. You will receive an in-app notification when approved.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="help-bottom-cta">
                <div>
                  <strong>Need to make a booking right now?</strong>
                  <p>Proceed to the vehicle requisition form with pre-filled staff directory and route builder.</p>
                </div>
                <button
                  type="button"
                  className="help-cta-btn"
                  onClick={onNavigateToRequest}
                >
                  Go to Request Form →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: APPROVAL WORKFLOW & RULES */}
          {activeTab === "workflow" && (
            <div className="help-tab-pane">
              <div className="help-section-header">
                <h3>Authorization Levels &amp; Approval Routing</h3>
                <p>
                  Chrysalis enforces a hierarchical authorization framework to ensure project accountability and vehicle safety compliance.
                </p>
              </div>

              <div className="help-workflow-flow">
                <div className="workflow-card">
                  <span className="wf-step">LEVEL 1</span>
                  <h4>Requester Submission</h4>
                  <p>Staff member submits trip schedule, passenger list, purpose, and project budget code.</p>
                  <span className="wf-tag">Originator</span>
                </div>
                <div className="wf-arrow">→</div>
                <div className="workflow-card">
                  <span className="wf-step">LEVEL 2</span>
                  <h4>Project Manager / Budget Holder</h4>
                  <p>Reviews travel purpose, verifies budget balance, and endorses journey requisition.</p>
                  <span className="wf-tag">Line Approval</span>
                </div>
                <div className="wf-arrow">→</div>
                <div className="workflow-card">
                  <span className="wf-step">LEVEL 3</span>
                  <h4>Director / CEO Escalation</h4>
                  <p>Required for CHR organizational budgets, inter-office outstation trips, or Director requests.</p>
                  <span className="wf-tag">Executive Clearance</span>
                </div>
                <div className="wf-arrow">→</div>
                <div className="workflow-card highlighted">
                  <span className="wf-step">LEVEL 4</span>
                  <h4>Operations &amp; Fleet Admin</h4>
                  <p>Allocates vehicle registration, verifies driver availability, and issues trip dispatch note.</p>
                  <span className="wf-tag">Vehicle Allocation</span>
                </div>
              </div>

              <div className="help-status-table-wrap">
                <h4>Requisition Status Lifecycle Key</h4>
                <div className="help-status-grid">
                  <div className="status-row">
                    <span className="status-chip amber">Awaiting approval</span>
                    <div>
                      <strong>Pending Line Approver</strong>
                      <p>Currently in the personal queue of the Project Manager or Budget Holder for review.</p>
                    </div>
                  </div>
                  <div className="status-row">
                    <span className="status-chip green">Approved</span>
                    <div>
                      <strong>Authorized by Budget Holder</strong>
                      <p>Budget cleared. Awaiting vehicle and driver assignment by Area Fleet Admin.</p>
                    </div>
                  </div>
                  <div className="status-row">
                    <span className="status-chip blue">Allocated / In Transit</span>
                    <div>
                      <strong>Vehicle &amp; Driver Assigned</strong>
                      <p>Official registration issued. Trip is active or scheduled for immediate dispatch.</p>
                    </div>
                  </div>
                  <div className="status-row">
                    <span className="status-chip red">Needs revision</span>
                    <div>
                      <strong>Revision Requested</strong>
                      <p>Approver has requested changes to route, passengers, or budget code before authorization.</p>
                    </div>
                  </div>
                  <div className="status-row">
                    <span className="status-chip gray">Completed</span>
                    <div>
                      <strong>Trip Concluded</strong>
                      <p>Vehicle returned to base office, return odometer logged, and trip sheet signed.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="help-policy-note">
                <strong>Important Advance Notice Policy:</strong> Standard requisitions must be submitted at least <strong>72 hours (3 business days)</strong> in advance. Urgent or same-day requisitions require phone confirmation with the Transport Desk.
              </div>
            </div>
          )}

          {/* TAB 3: FLEET RULES & SAFETY PROTOCOL */}
          {activeTab === "safety" && (
            <div className="help-tab-pane">
              <div className="help-section-header">
                <h3>Fleet Safety, Logbooks &amp; Emergency Protocols</h3>
                <p>
                  Operational standards for passengers, drivers, and fleet vehicles to ensure safety and audit compliance.
                </p>
              </div>

              <div className="help-guidelines-grid">
                <div className="guideline-card">
                  <span className="gl-badge">LOGBOOKS &amp; MILEAGE</span>
                  <h4>Vehicle Trip Logsheets</h4>
                  <p>
                    Prior to departure, verify that the driver records the starting odometer and fuel reading. Upon completion of the trip, the lead passenger must inspect the closing odometer reading and sign the official logsheet.
                  </p>
                  <small>No vehicle may depart base office without an authorized logsheet entry.</small>
                </div>

                <div className="guideline-card">
                  <span className="gl-badge">NIGHT DRIVING</span>
                  <h4>Night Travel &amp; Secure Parking</h4>
                  <p>
                    Long-distance driving past 21:00 is discouraged and requires prior clearance. Vehicles kept overnight on outstation missions must be parked in verified secure compounds with 24/7 security or official premises.
                  </p>
                  <small>Under no circumstances should vehicles be left unattended on public roads.</small>
                </div>

                <div className="guideline-card">
                  <span className="gl-badge">BREAKDOWNS</span>
                  <h4>Breakdown &amp; Incident Procedure</h4>
                  <p>
                    In case of mechanical breakdown or puncture:
                  </p>
                  <ol className="help-incident-list">
                    <li>Ensure all passengers step out safely away from traffic.</li>
                    <li>Place emergency reflective triangle 50m behind the vehicle.</li>
                    <li>Immediately call Chrysalis 24/7 Operations Desk (+94 77 123 4567).</li>
                    <li>The Area Admin coordinates local roadside assistance or replacement dispatch.</li>
                  </ol>
                </div>

                <div className="guideline-card">
                  <span className="gl-badge">HIRED VEHICLES</span>
                  <h4>Hired / Commercial Transport</h4>
                  <p>
                    When pool vehicles are fully committed, Area Admin contracts approved commercial rental vehicles. Hired drivers must adhere to Chrysalis zero-tolerance substance policies and speed limits.
                  </p>
                  <small>Seat belts are mandatory for all passengers at all times.</small>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUBMIT SUPPORT TICKET */}
          {activeTab === "ticket" && (
            <div className="help-tab-pane">
              <div className="help-section-header">
                <h3>Submit an Operations Helpdesk Ticket</h3>
                <p>
                  Submit a direct support request to the Transport &amp; Fleet Administration Desk for urgent trip amendments, breakdown recovery, budget code adjustments, or general system inquiries.
                </p>
              </div>

              {ticketSubmitted && (
                <div className="ticket-success-alert">
                  <span className="success-icon">✓</span>
                  <div>
                    <strong>Helpdesk Ticket Registered: {lastSubmittedId}</strong>
                    <p>Your request has been routed to the Operations Duty Desk. Response within 30 minutes for urgent matters.</p>
                  </div>
                  <button type="button" onClick={() => setTicketSubmitted(false)}>Submit another</button>
                </div>
              )}

              <form className="help-ticket-form" onSubmit={handleTicketSubmit}>
                <div className="ticket-form-grid">
                  <label>
                    <span>Request Category *</span>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                    >
                      <option>Urgent Transport Assistance</option>
                      <option>Booking Amendment / Reschedule</option>
                      <option>Cancel Existing Booking</option>
                      <option>Driver / Vehicle Issue</option>
                      <option>Budget Code / Approver Issue</option>
                      <option>General Helpdesk Inquiry</option>
                    </select>
                  </label>

                  <label>
                    <span>Priority Level *</span>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as "normal" | "urgent" | "emergency")}
                    >
                      <option value="normal">Normal (Routine response within 4 hours)</option>
                      <option value="urgent">Urgent (Trip within 24 hours)</option>
                      <option value="emergency">Critical Emergency (Immediate response)</option>
                    </select>
                  </label>

                  <label>
                    <span>Related Vehicle Requisition ID (Optional)</span>
                    <input
                      placeholder="e.g. VR-260814-039"
                      value={relatedReqId}
                      onChange={(e) => setRelatedReqId(e.target.value)}
                    />
                  </label>

                  <label>
                    <span>Contact Phone / Extension</span>
                    <input
                      placeholder="e.g. +94 77 123 4567 or Ext 402"
                      value={ticketPhone}
                      onChange={(e) => setTicketPhone(e.target.value)}
                    />
                  </label>

                  <label className="full-width">
                    <span>Subject / Short Summary *</span>
                    <input
                      placeholder="e.g. Urgent departure reschedule for Badulla field mission"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      required
                    />
                  </label>

                  <label className="full-width">
                    <span>Detailed Request / Description *</span>
                    <textarea
                      rows={4}
                      placeholder="Provide all necessary details (changes in passenger count, route adjustment, reason for cancellation, or issue encountered)..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="ticket-form-footer">
                  <span className="requester-indicator">
                    Submitting as: <strong>{currentUser}</strong> ({currentOffice})
                  </span>
                  <button type="submit" className="help-submit-btn">
                    Submit Helpdesk Ticket →
                  </button>
                </div>
              </form>

              {/* Submitted Tickets History */}
              <div className="submitted-tickets-section">
                <h4>Your Active Helpdesk Requests ({tickets.length})</h4>
                {tickets.length ? (
                  <div className="ticket-cards-list">
                    {tickets.map((t) => (
                      <div key={t.id} className="ticket-item-card">
                        <div className="ticket-item-head">
                          <span className="ticket-id-tag">{t.id}</span>
                          <span className={"ticket-priority-pill " + t.priority}>
                            {t.priority.toUpperCase()}
                          </span>
                          <span className="ticket-status-pill">{t.status}</span>
                          <span className="ticket-date">{t.createdAt}</span>
                        </div>
                        <h5>{t.subject}</h5>
                        <p>{t.message}</p>
                        <div className="ticket-meta-footer">
                          <span>Category: <strong>{t.category}</strong></span>
                          {t.relatedRequestId && (
                            <span>Requisition: <strong>{t.relatedRequestId}</strong></span>
                          )}
                          {t.contactPhone && (
                            <span>Phone: <strong>{t.contactPhone}</strong></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-tickets-msg">No support tickets submitted yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: OPERATIONS CONTACTS & HELPLINES */}
          {activeTab === "contacts" && (
            <div className="help-tab-pane">
              <div className="help-section-header">
                <h3>Transport Helplines &amp; Area Office Contacts</h3>
                <p>
                  Official communication lines for fleet operations, roadside breakdowns, and area transport coordinators.
                </p>
              </div>

              <div className="help-contacts-grid">
                {/* Central Helpdesk */}
                <div className="contact-box main-desk">
                  <span className="desk-tag">CENTRAL DESK</span>
                  <h4>Colombo Head Office Operations</h4>
                  <p>Responsible for overall mobility coordination, approvals, and fleet policy.</p>
                  <dl>
                    <div>
                      <dt>General Office Tel:</dt>
                      <dd>+94 11 258 4500 (Ext 402 / 405)</dd>
                    </div>
                    <div>
                      <dt>Transport Desk Mobile:</dt>
                      <dd>+94 77 234 5678</dd>
                    </div>
                    <div>
                      <dt>Official Email:</dt>
                      <dd>transport@chrysalis.lk</dd>
                    </div>
                    <div>
                      <dt>Office Address:</dt>
                      <dd>21, Rodney Street, Colombo 08</dd>
                    </div>
                  </dl>
                </div>

                {/* 24/7 Roadside Emergency */}
                <div className="contact-box emergency-desk">
                  <span className="desk-tag emergency">24/7 ROADSIDE EMERGENCY</span>
                  <h4>Emergency &amp; Breakdown Line</h4>
                  <p>Immediate assistance for mechanical failures, accidents, or driver emergencies.</p>
                  <dl>
                    <div>
                      <dt>Duty Fleet Coordinator:</dt>
                      <dd><strong>+94 77 123 4567</strong></dd>
                    </div>
                    <div>
                      <dt>Alternate Duty Hotline:</dt>
                      <dd>+94 71 890 1234</dd>
                    </div>
                    <div>
                      <dt>Insurance Hotline:</dt>
                      <dd>1301 (Sri Lanka Insurance Corp)</dd>
                    </div>
                    <div>
                      <dt>Operating Hours:</dt>
                      <dd>24 Hours / 7 Days a week</dd>
                    </div>
                  </dl>
                </div>

                {/* Regional Desks */}
                <div className="contact-box">
                  <span className="desk-tag">EASTERN PROVINCE</span>
                  <h4>Batticaloa Area Office</h4>
                  <dl>
                    <div>
                      <dt>Transport Coordinator:</dt>
                      <dd>+94 65 222 3450</dd>
                    </div>
                    <div>
                      <dt>Email:</dt>
                      <dd>batticaloa.ops@chrysalis.lk</dd>
                    </div>
                  </dl>
                </div>

                <div className="contact-box">
                  <span className="desk-tag">NORTHERN PROVINCE</span>
                  <h4>Jaffna Regional Office</h4>
                  <dl>
                    <div>
                      <dt>Transport Coordinator:</dt>
                      <dd>+94 21 221 5670</dd>
                    </div>
                    <div>
                      <dt>Email:</dt>
                      <dd>jaffna.ops@chrysalis.lk</dd>
                    </div>
                  </dl>
                </div>

                <div className="contact-box">
                  <span className="desk-tag">SOUTHERN PROVINCE</span>
                  <h4>Matara / Southern Desk</h4>
                  <dl>
                    <div>
                      <dt>Transport Coordinator:</dt>
                      <dd>+94 41 223 8900</dd>
                    </div>
                    <div>
                      <dt>Email:</dt>
                      <dd>matara.ops@chrysalis.lk</dd>
                    </div>
                  </dl>
                </div>

                <div className="contact-box">
                  <span className="desk-tag">CENTRAL HIGHLANDS</span>
                  <h4>Nuwara Eliya Field Center</h4>
                  <dl>
                    <div>
                      <dt>Transport Coordinator:</dt>
                      <dd>+94 52 222 4110</dd>
                    </div>
                    <div>
                      <dt>Email:</dt>
                      <dd>nuwaraeliya.ops@chrysalis.lk</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="help-modal-footer">
          <div className="help-footer-info">
            <span>Chrysalis Mobility Operations Manual · Version 2.6</span>
            <small>Signed in as {currentUser} ({currentRole} · {currentOffice})</small>
          </div>
          <button type="button" className="help-footer-close-btn" onClick={onClose}>
            Close Guide
          </button>
        </footer>
      </section>
    </div>
  );
}
