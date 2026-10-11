// Categorical grades shared by the judge, tasks and intel (never a 1-10 score).

enum Grade {
    Poor,
    Fair,
    Good,
    Excellent,
}

enum Aspect {
    Massing,
    Roof,
    Facades,
    Elements
        @description(
            "the recognisable things the brief asks for (signs, banners, props...) read as what they are",
        ),
    Finish @description("edges, trim, depth, no noise or broken bits"),
    Palette,
}

enum Severity {
    Major,
    Minor,
}

class Issue {
    aspect: Aspect,
    severity: Severity,
    problem: string @description("what is wrong, where (face / part), in a few words"),
    fix: string @description("a concrete change a builder could make with the toolkit"),
}
