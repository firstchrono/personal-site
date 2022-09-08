import Styles from './styles.module.scss';
import Button from '../Button/index.jsx';

function ContactForm() {
	return (
		/*<div class={Styles.contact_form}>
            <form target="_blank" action="https://formsubmit.co/contact@jonstump.xyz" method="POST">
                <div class={Styles.form-group}>
                    <div class={Styles.form-row}>
                        <div class={Styles.col}>
                            <input type="text" name="name" class={Styles.form-control} placeholder="Full Name" required />
                        </div>
                        <div class={Styles.col}>
                            <input type="email" name="email" class={Styles.form-control} placeholder="Email Address" required />
                        </div>
                    </div>
                </div>
                <div class={Styles.form-group}>
                    <textarea placeholder="Your Message" class={Styles.form-control} name="message" rows="10" required></textarea>
                </div>
                <Button>Submit Form</Button>
            </form>
        </div> */
        <Button>Submit Form</Button>		
	);
}

export default ContactForm;