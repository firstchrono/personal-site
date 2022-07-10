---
layout: ../../layouts/project.astro
title: "Shifting Left: My dive into SecDevOps"
publishDate: 2021-10-20
category:
  - DevOps
  - Security
img: /assets/blog/cybersecuritylockimage.jpg
author: Jon
tags: 
  - devops
  - security
---

In late 2021 and early 2022, we saw CVE's for some big players in the tech community. These CVE's have wrecked havoc. While it's near impossible to prevent vulnerabilities and security issues (not that we don't try), the question becomes, "How do we respond to them as they are discovered?".

Now, these CVE's caused some minor panic (specficially Log4j), but a while ago, I had some other CVE's pop up and I knew that it would require some action to diagnose and understand the the action, if any, that would be required from our company. Not soon after, I realized that our codebase was running old, outdated packages. We were not keeping any inventory of our 3rd party dependencies, not scanning to see if there were any CVE's with said dependencies, or even checking if there were updates to them. I think it took me 4 hours to determine, for each CVE, whether or not we even needed to do _anything_ in response.

![everything is fine dog](/assets/blog/blogImages/everythingisfine.jpeg)

So how do we solve these problems? If you thought that updating packages was the solution, oh boy, you're in for ride.

First, updating to the _latest_ version isn't always the best or correct answer. In the case of these CVE's, the issue was that packages with malicious code injected were deployed to NPM. Having auto upgrades or always taking the latest would've compromised our systems.

Ok, we can't just upgrade packages whenever we want, so can we stay on an older version? Well, you can, however, you're bound to run into some sort of vulnerability in that version and _need_ to upgrade to a newer version that patches the issue. So we can't leave packages on old versions forever, so what's the answer? Well, it's complicated. Seems odd to say that in a blog, but I want you (the reader) to understand that this isn't a "I'm gonna go read someone's blog and have all the answers" type of post. This post will walk you through what I did and what I learned. You may choose to go a different route. I'm not here to tell you "do x, not y".

Now that we understand each other, my solution was a combination of items.

Short-term solution. This solution took less than a couple of days to implement, provides value immediately to the DevOps team, Dev team, Dev managers, and upper management. [WhiteSource Bolt](https://google.com) was my _immediate_ answer. It's a free extension for both Azure DevOps (what my company works in) and GitHub. You don't have all the features you could desire but it provides the following information:

* 3rd Party Package Dependency Inventory
* Package Security Vulnerability Reports
* License Compliance Report

By adding WhiteSource Bolt into our build pipelines, we were able to quickly gather information and understand where the vulnerabilities exist. It doesn't fix them, and it shouldn't. Time to implement? No more than a few minutes on either Azure DevOps or GitHub. I'm not going to cover the exact steps. The documentation on WhiteSource's site is more than good enough to get it up and running as quickly as I did.

_Sidebar_: When evaluating a product, features are going to draw you in, but take a peek at their documentation or knowledgebase. A company with poor documentation is going to send you down rabbit hole after rabbit hole in the long run.

### _Back to our normally scheduled programming (hehe)_

Alright, so we have a solid short-term, potentially long-term solution in place. Now we can focus on bigger goals for additional security scanning/tooling. When I was looking for a product/suite, the 4 items below were my main priority. There were a lot of secondary priorities, but these take the cake.

1. SAST - [defined by Gartner](https://www.gartner.com/en/information-technology/glossary/static-application-security-testing-sast)
2. IaC Support - Dockerfile, Helm Charts, Terraform
3. Pipeline Support
4. IDE Support - Specifically Visual Studio and VSCode.

The tools I started evaulating were Checkmarx, Snyk, and SonarQube. Long story short, I picked TOOL as the tool to use. Here's why.

The biggest value add was the plugin/add-on capabilities in the IDE that we use. Having the ability for our engineers to get feedback while they are writing the code is invaluable. I want them to be able to focus on writing code and not waiting for builds and feedback. That being said, there is still tremendous value in the deeper scans and feedback in the pull request.

The pipeline support is kind of a no-brainer. Being able to add it to our build pipelines without much effort is quite useful, however, one of the secondary priorities is that we have API access or additional CLI tooling.

Now that it's all implemented, has it actually done anything for us? Yes, yes it has. We've identified more than a dozen vulnerabilities that we were not aware of previously. We've customized our policy and process flow so that if an engineer opens a pull request and fails a check for number of vulnerabilities or for a high score (9.0 or above), an automated comment is made and the request cannot be approved until it's resolved.

With these tools in place, we have more confidence in approving and deploying code. Now, when a CVE is discovered, instead of spending hours tracking down if we even use the tool, we can spend fixing it if there's a need. We've increased our velocity, decreased our false positives. With the reporting and UI, management get's to see what's being fixed and what vulnerabilities exist.
