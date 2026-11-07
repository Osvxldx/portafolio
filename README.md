# Osvaldo's portfolio: a night garden that lights up

My portfolio for the **AWS Student Builder Challenge**. It tells my story, shows my skills and projects, and ends with a live **kindness meadow**: visitors plant a flower with one small, good thing they'll do today, and everyone sees it.

> Every flower is the same size, because every kind act counts the same.

## The idea

Every flower on the page starts as a pencil sketch and lights up into a painting when the light finds it, the same way I learned: one step at a time. A firefly guides you down the page and lights each part as it arrives.

## What's on the page

- **Hero:** azaleas in a beam of warm light, painted with Higgsfield. The pencil sketch draws itself, then the painting lights up through it. Petals fall through the beam (click anywhere to free more), gold dust drifts, and the painting leans toward your mouse.
- **About:** an azalea that is sketched while you read and lights up when the firefly reaches it.
- **Skills:** loose pencil strokes gather into a bouquet as you scroll. Every flower is a skill; hover one to read it and see its group.
- **Experience and work:** pages from a sketchbook, each with a hand-drawn edge and a pressed flower: a business intelligence internship at MBQ Group, Prometheus (Top 20 of 111 at the Salesforce Agentic AI Hackathon), a freelance water utility system, and this site.
- **My journey:** from September 2024, when I knew nothing about tech, to today. A stem grows toward the light as you scroll, and every milestone is a seed that opens into a flower when the stem reaches it.
- **The story behind my smile:** a short personal story in a jar of fireflies, if you want to open it.
- **Your turn:** the endless meadow. Drag it sideways (or use the arrows). The 150 newest flowers can be read by hovering or tapping them; the rest of the count fills the meadow further out, so it never runs out of room. While you write your name, a preview of your flower lights up.

English lives at `/` and Spanish at `/es/`. Night is the default, with a warm paper day theme. With reduced motion, everything is shown finished and only fades remain. Everything works with a keyboard, and the meadow has a hidden list of every readable flower for screen readers.

## How it's built

![Architecture: the visitor loads the site from AWS Amplify Hosting and adds flowers through Amazon API Gateway, AWS Lambda and Amazon DynamoDB. Amazon SNS emails me when a flower needs review.](docs/architecture.png)

- **Frontend:** [Astro](https://astro.build) (static output, built-in i18n), GSAP (ScrollTrigger, SplitText, DrawSVG, MorphSVG), Lenis smooth scroll, a 2D canvas for the meadow and the night air, self-hosted fonts (Cormorant Infant, Figtree, Gochi Hand).
- **Art:** Higgsfield (GPT Image 2.6) for the painted flowers, with transparent backgrounds. Each pencil sketch is traced from its painting with ffmpeg edge detection, so the two line up exactly. The bouquet, seeds, stems and jar are SVG drawn in code.
- **AWS Amplify Hosting:** builds and deploys the site from this repository on every push (`amplify.yml`).
- **Amazon API Gateway (HTTP API):** `GET /links` and `POST /links`, with CORS limited to my site and throttling.
- **AWS Lambda:** checks names and actions, blocks rude words in English and Spanish, blocks links and phone numbers, and limits each visitor to one flower every 30 seconds. IP addresses are hashed.
- **Amazon DynamoDB:** stores the flowers; rate-limit records expire with TTL.
- **Amazon SNS:** emails me when a flower in a visitor's own words needs review.
- **AWS IAM, Amazon CloudWatch and AWS CloudFormation:** a least-privilege role, logs, and the whole backend in one template (`infra/kindness-chain.yaml`).

### Keeping the meadow kind

Preset actions bloom right away. A flower in the visitor's own words is saved as `pending`: only its author sees it, still as a pencil sketch, until I approve it in DynamoDB (`status` → `visible`). To remove any flower I set `status` to `hidden`.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

`public/config.js` holds the API address. Leave `CHAIN_API_URL` empty to run the meadow in preview mode (saved only in your browser). `?motion=full` shows every animation even with reduced motion on; `?theme=light|dark` previews a theme.

## Backend

```bash
node infra/lambda/test.js   # run the Lambda tests
node infra/build.mjs        # rebuild infra/kindness-chain.yaml after editing the Lambda
```

---

Built with care by Osvaldo Casimiro Zamora.
