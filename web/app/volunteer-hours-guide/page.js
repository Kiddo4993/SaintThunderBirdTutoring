import Link from "next/link";

export const metadata = {
  title: "Volunteer Hour Tracking - Saint Thunderbird",
};

export default function VolunteerHoursGuidePage() {
  return (
    <>
      <div className="mesh-gradient"></div>
      <div className="vol-container">
        <Link href="/tutor-dashboard" className="back-button">← Back to Dashboard</Link>

        <div className="vol-header">
          <h1>⚡ Volunteer Hour Tracking Guide</h1>
          <p>Learn how to track and report your volunteer hours at Saint Thunderbird</p>
        </div>

        <div className="vol-section">
          <h2>📊 Why Track Your Volunteer Hours?</h2>
          <p>Tracking your volunteer hours at Saint Thunderbird helps you:</p>
          <ul>
            <li><strong>See your impact:</strong> Know exactly how many hours you&apos;ve contributed to helping First Nations students succeed academically</li>
            <li><strong>Get recognition:</strong> You deserve credit for your awesome work in making a real difference</li>
            <li><strong>Support the mission:</strong> Help Saint Thunderbird demonstrate our reach and impact to communities and potential donors</li>
            <li><strong>Employer benefits:</strong> Many companies reward employees for volunteer work with grants or recognition programs</li>
          </ul>
        </div>

        <div className="vol-section">
          <h2>📧 Reporting Your Volunteer Hours</h2>

          <h3>To Request Official Documentation:</h3>
          <p>If you need official verification of your volunteer hours for your school, employer, or organization, please contact us:</p>

          <div className="contact-info">
            📧 Email: <strong>dylanduancanada@gmail.com</strong><br />
            Include your name, the date range for hours you&apos;re requesting, and your total hours.
          </div>

          <h3>What We&apos;ll Provide:</h3>
          <ul>
            <li>Official verification letter with your total volunteer hours</li>
            <li>Breakdown of hours by activity type</li>
            <li>Dates of service</li>
            <li>Saint Thunderbird&apos;s official letterhead and contact information</li>
          </ul>

          <h3>Using Your Hours:</h3>
          <ul>
            <li><strong>School Service Learning:</strong> Submit your verification letter to fulfill school community service requirements</li>
            <li><strong>College Applications:</strong> Include volunteer hours in your &quot;Community Service&quot; or &quot;Volunteer Work&quot; section</li>
            <li><strong>Employer Programs:</strong> If your company has a volunteer grant program (Dollars for Doers), submit your hours for potential donations to Saint Thunderbird</li>
            <li><strong>Professional Development:</strong> List hours as volunteer tutoring experience for resume or professional profiles</li>
          </ul>
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link href="/tutor-dashboard" className="cta-button">← Return to Dashboard</Link>
        </div>
      </div>
    </>
  );
}
