import "./Contact.css";
import teamImage from "./download.jpeg";

function Contact() {
    return(
        <div className="contact-page">
            <h1>Contact Page</h1>
            <div className="manager-box">
                <h2>Our Team</h2>
                <img src={teamImage} />
                <h2>Our Mission</h2>
                <h3>Make Flowriding Grow</h3>
                <h3>Provide a Surf Haven in the middle of Copenhagen</h3>
            </div>
            <div className="contact-box">
              <div className="call">
                <h3> Call Us: +4561616565 </h3>
              </div>
              <div className="email">
                <h3>Email Us: Flowhouse.Copenhagen@gmail.com</h3>
              </div>
            </div>
        </div>
    )
}

export default Contact;