import { h } from 'preact';
import Styles from './styles.module.scss';

function Resume({ project }) {
	const { frontmatter } = project;
	return (
		<div className={Styles.card}>
			<div className={Styles.titleCard} style={`background-image:url(${frontmatter.img})`}>
			</div>
			<div className="pa3">
				<p className={Styles.title}>{frontmatter.title}</p>
				<p className={`${Styles.desc} mt0 mb2`}>{frontmatter.description}</p>
				<div className={Styles.tags}>
					Tagged:
					{frontmatter.tags.map((t) => (
						<div className={Styles.tag} data-tag={t}>
							{t}
						</div>
					))}
				</div>
				<a className={Styles.link} href={project.url}>
					<span className={Styles.linkInner}>View</span>
				</a>
			</div>
		</div>
	);
}

export default Resume;
