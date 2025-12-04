# Node-Based Workflows
## Introduction
A few weeks ago I heard about n8n, which recently gained headway for being able to create agentic workflows. I wasn't familiar with the idea of an "agentic" workflow, particualtly a node-based one, so I decided to look into it. In short, **n8n** lets you plug any LLM (OpenAI, Claude, Gemini, etc...) directly insto a visual workflow as a reusable "AI Agent" node that can reason, remember context, and decide which tools or actions to call next. This AI agent's ability to dynamically plan and execute multi-step tasks is known as an **agentic workflow**.

## Getting Started
I followed this tutorial on Youtube [n8n Tutorial for Beginners - Build Your First Free AI Agent](https://youtu.be/dpoMEcXjVH8?si=IscKdNpBLCBB3JnI) to get started on creating an AI Agent in n8n. After setting up, n8n gave me a template to "Test a simple AI Agent example" that looked like this:

<img width="367" height="217" alt="Screenshot 2025-11-22 192222" src="https://github.com/user-attachments/assets/9bd04f6d-afec-41ae-9bb6-afc560536c35" />

I had to set up the LLM model with my OpenAi key which I had already made for one of my classes. Just setting up the model didn't work, I had to give it **memory**. Memory helps the LLM keep context of your conversation. When I clicked to add memory, I noticed that I could choose databases like Postgres, Redis, and MongoDB to save my chat history; I just used simple memory though and set it to only remember the last 5 chats. The last step to creating my AI agent was by adding **tools** to it. This gives the agent power to do what it needs to do. There were hundreds of tool which I could choose from, like the AWS S3 Tool which sends data to AWS S3, or Gmail tool which lets the AI be able to send emails when you give it a prompt. For simplicity, I chose the "Code" tool because all of the other services required an API key of some sort which I had to sign up for. In the code tool I entered `return query.toUpperCase()`. The AI agent could then call that line of code whenever I ask it something relevant to that line. 

For example, I asked the AI Agent "Please repeat this prompt back to me but in upper case using the code from the n8n code tool" and in response it returned the prompt in all upper case.

## How it works
1. The "when chat message is received" node is known as the **trigger node**. This receives my prompts for the AI an turns them into a json query.
2. Inside the AI Agent node, n8n does the following loop until the agent is happy:
  - Sends the full conversation and tool description to the LLM (ChatGPT for me)
  - The LLM decides: "Do I already know the answer, or do I need to use a tool?"
  - If it needs a tool, the model outputs a structured tool-call request (too name + parameters). In the example case, the only tool was the uppercase tool.
  - n8n automatically executes that Code node with the parameters the model asked for.
  - The result of the tool is fed back to the LLM as a new message.
  - The LLM can the decide to reason, call the tool a second time if needed, or finally give the answer.
3. When the LLM marks its response as "final", n8n sends that text back through the trigger node to your chat window.

This back-and-forth reasoning is esactly what makes the workflow agentic: the LLM is no longer just answering in one shot; it is allowed to think, use tools, observer results, and think again.

## Cool stuff
n8n provides various templates that give the ability to run some pretty complex agent workflows. For example, one of the workflows I looked at was a way to get data from Google Maps at a cheaper cost that using the Google Maps API. This stood out to me because I was limited om what I could do for one of my class projects because of the cost of Google Maps API, so it's nice to know that people are creating cheaper alternatives on n8n. Here is what the workflow looks like:
<img width="1833" height="449" alt="Screenshot 2025-11-25 182059" src="https://github.com/user-attachments/assets/b66d57db-f899-45df-883c-44a755a41574" />

## Non-agentic workflows
While I've mainly focused on n8n's ability to create agentic workflows, it still works perfectly as a no-code alternative to CI/CD workflows. n8n has triggers that can connect to Github and start prococesses when new code is pushed, just like you classic `.yml` file.


