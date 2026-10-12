/**
 * Consumer wording (F-019).
 *
 * The engine names a check `rightClearance` and reports "필요 295mm, 확보
 * 100mm". That is correct and it is what a developer needs. A shopper needs
 * "오른쪽 문을 열 공간이 195mm 부족합니다".
 *
 * This module is the translation layer between the two. It changes NO rule and
 * NO number - it only decides which sentence a given check id and status turn
 * into, and in what order the parts are shown:
 *
 *     1. what the problem is      "오른쪽 문을 열 공간이 부족합니다"
 *     2. how short it is          "195mm 더 필요"
 *     3. the numbers behind it    "현재 100mm · 필요 295mm"
 *     4. whose rule it is         "삼성전자 공식 설치 기준"
 *
 * The manufacturer's figure is deliberately LAST. See PROJECT_SPEC.md s.20.
 */
import { formatCmWithUnit } from '../utils/consumerUnits';
import type { InstallationVerdict } from '../types/result';

export type IssueRegion = 'left' | 'right' | 'rear' | 'top' | 'front' | 'body';
/**
 * WHAT KIND OF PROBLEM THIS IS, spatially.
 *
 * Two failures can land in the same part of the room and mean completely
 * different things. A ceiling too low for the appliance and a ceiling too low
 * for the manufacturer's installation height both sit above the cabinet, and
 * drawn as two identical red slabs labelled "113mm 부족" and "160mm 부족" they
 * are indistinguishable - the shopper is handed two numbers and left to work
 * out which is which.
 *
 *   physicalFit        the PRODUCT itself does not fit inside the space. Its
 *                      own boundary is past the wall or the ceiling.
 *   requiredClearance  the product fits, but the maker asks for free space
 *                      around it that this room does not have.
 *   doorClearance      the room the door needs to swing.
 *   projection         not a failure at all: how far it stands proud.
 *
 * The order above is the order of consequence, and `ISSUE_KIND_RANK` uses it:
 * if the box does not go in at all, the clearance question is academic.
 */
export type IssueKind = 'physicalFit' | 'requiredClearance' | 'doorClearance' | 'projection';

export const ISSUE_KIND_RANK: Record<IssueKind, number> = {
  physicalFit: 0,
  requiredClearance: 1,
  doorClearance: 2,
  projection: 3,
};

/** How one check is presented to a shopper. */
export interface ConsumerCopy {
  /** Plain statement of the problem, used as the card title on a failure. */
  problem: string;
  /** What the shopper would have to change. */
  action: (shortageMm: number) => string;
  /** Short label used when everything passes. */
  passLabel: string;
  /** Sentence used when the check could not be decided. */
  unknown: string;
  /** Which part of the scene explains it. */
  region: IssueRegion;
  /** What sort of problem it is, which decides how the scene draws it. */
  kind: IssueKind;
  /**
   * WHAT the problem is, in two or three words, for a label floating in the
   * room. Deliberately shorter than `passLabel`: a pill in a kitchen has room
   * for a noun and a number, and nothing else.
   */
  sceneLabel: string;
}

/**
 * A length as the shopper reads it.
 *
 * Named `mm` until v1.46 and it formatted millimetres; the engine still
 * speaks millimetres and this still takes them, but nobody measures a kitchen
 * in them. See `utils/consumerUnits.ts` for why the conversion lives in one
 * place and why 1853 still comes back as 185.3.
 */
const len = (valueMm: number) => formatCmWithUnit(valueMm);

/**
 * Keyed by check id. Door checks add a `:left` / `:right` suffix, which
 * `consumerCopyFor` strips before looking up the side-specific entry.
 */
const COPY: Record<string, ConsumerCopy> = {
  bodyWidth: {
    problem: '냉장고가 설치 공간보다 넓어요',
    action: (shortage) => `공간 너비가 ${len(shortage)} 더 필요해요`,
    passLabel: '공간 너비',
    unknown: '제품 너비 정보가 없어 확인하지 못했어요',
    region: 'body',
    kind: 'physicalFit',
    sceneLabel: '제품 너비',
  },
  bodyHeight: {
    problem: '냉장고가 설치 공간보다 높아요',
    action: (shortage) => `공간 높이가 ${len(shortage)} 더 필요해요`,
    passLabel: '공간 높이',
    unknown: '제품 높이 정보가 없어 확인하지 못했어요',
    region: 'top',
    kind: 'physicalFit',
    sceneLabel: '제품 높이',
  },
  /**
   * Not a problem, a fact. A freestanding refrigerator deeper than the recess
   * simply stands proud of it. The wording says how far and what the one case
   * is where it would matter, and never uses a failure word.
   */
  frontProjection: {
    problem: '제품이 설치 공간보다 앞으로 나와요',
    action: (amount) => `약 ${len(amount)} 앞으로 나와요`,
    passLabel: '앞으로 나오는 정도',
    unknown: '제품이 얼마나 앞으로 나오는지 확인하지 못했어요',
    region: 'front',
    kind: 'projection',
    sceneLabel: '앞으로 나옴',
  },
  requiredInstallationHeight: {
    /*
     * NOT "제품은 들어가지만 위쪽 여유가 모자라요".
     *
     * The required installation height is always the larger of the two height
     * figures, so when a space is shorter than the appliance itself BOTH rows
     * fail - and the panel then said "냉장고가 설치 공간보다 높아요" directly above
     * "제품은 들어가지만…". One of the two had to be wrong, and it was this one:
     * it silently assumed the plain body height had passed. This wording is
     * true whether it did or not, and the row's own figures still show that
     * this is the larger requirement.
     */
    problem: '설치하려면 위쪽 여유가 더 필요해요',
    action: (shortage) => `위쪽 공간이 ${len(shortage)} 더 필요해요`,
    passLabel: '설치에 필요한 높이',
    unknown: '설치에 필요한 높이를 확인하지 못했어요',
    region: 'top',
    kind: 'requiredClearance',
    sceneLabel: '위쪽 여유',
  },
  requiredInstallationWidth: {
    problem: '설치 개구부의 폭이 모자라요', action: shortage => `설치 폭이 ${len(shortage)} 더 필요해요`,
    passLabel: '설치 개구부 폭', unknown: '제조사의 설치 개구부 폭을 확인하지 못했어요',
    region: 'body', kind: 'requiredClearance', sceneLabel: '설치 폭',
  },
  requiredInstallationDepth: {
    problem: '설치 개구부의 깊이가 모자라요', action: shortage => `설치 깊이가 ${len(shortage)} 더 필요해요`,
    passLabel: '설치 개구부 깊이', unknown: '제조사의 설치 개구부 깊이를 확인하지 못했어요',
    region: 'front', kind: 'requiredClearance', sceneLabel: '설치 깊이',
  },
  leftClearance: {
    problem: '냉장고 왼쪽 틈이 모자라요',
    action: (shortage) => `왼쪽에 ${len(shortage)} 더 필요해요`,
    passLabel: '왼쪽 틈',
    unknown: '왼쪽에 필요한 틈을 확인하지 못했어요',
    region: 'left',
    kind: 'requiredClearance',
    sceneLabel: '왼쪽 틈',
  },
  rightClearance: {
    problem: '냉장고 오른쪽 틈이 모자라요',
    action: (shortage) => `오른쪽에 ${len(shortage)} 더 필요해요`,
    passLabel: '오른쪽 틈',
    unknown: '오른쪽에 필요한 틈을 확인하지 못했어요',
    region: 'right',
    kind: 'requiredClearance',
    sceneLabel: '오른쪽 틈',
  },
  rearClearance: {
    problem: '설치할 때 뒷벽에서 띄워야 해요',
    action: (gap) => `뒷벽에서 ${len(gap)} 띄워서 설치해요`,
    passLabel: '뒷벽에서 띄우는 간격',
    unknown: '뒤쪽 여유 공간 기준을 확인하지 못했어요',
    region: 'rear',
    kind: 'requiredClearance',
    sceneLabel: '뒤쪽 여유',
  },
  'doorSideClearance:left': {
    problem: '왼쪽 문을 열 공간이 모자라요',
    action: (shortage) => `왼쪽에 ${len(shortage)} 더 필요해요`,
    passLabel: '왼쪽 문 여는 공간',
    unknown: '왼쪽 문을 열 공간을 확인하지 못했어요',
    region: 'left',
    kind: 'doorClearance',
    sceneLabel: '왼쪽 문 공간',
  },
  'doorSideClearance:right': {
    problem: '오른쪽 문을 열 공간이 모자라요',
    action: (shortage) => `오른쪽에 ${len(shortage)} 더 필요해요`,
    passLabel: '오른쪽 문 여는 공간',
    unknown: '오른쪽 문을 열 공간을 확인하지 못했어요',
    region: 'right',
    kind: 'doorClearance',
    sceneLabel: '오른쪽 문 공간',
  },
  'doorSideClearance:single': {
    problem: '문을 열 공간이 모자라요',
    action: (shortage) => `옆에 ${len(shortage)} 더 필요해요`,
    passLabel: '문 여는 공간',
    unknown: '문을 열 공간을 확인하지 못했어요',
    region: 'left',
    kind: 'doorClearance',
    sceneLabel: '문 여는 공간',
  },
  doorSideClearance: {
    problem: '문을 열 공간을 확인할 수 없어요',
    action: (shortage) => `${len(shortage)} 더 필요해요`,
    passLabel: '문 여는 공간',
    unknown: '이 제품은 문에 필요한 공간 정보가 없어 확인하지 못했어요',
    region: 'left',
    kind: 'doorClearance',
    sceneLabel: '문 여는 공간',
  },
  ...Object.fromEntries((['upper', 'lower'] as const).map(id => {
    const label = id === 'upper' ? '상단 문' : '하단 문';
    return [`doorSideClearance:${id}`, {
      problem: `${label}을 열 공간이 모자라요`,
      action: (shortage: number) => `옆에 ${len(shortage)} 더 필요해요`,
      passLabel: `${label} 여는 공간`, unknown: `${label}을 열 공간을 확인하지 못했어요`,
      region: 'body', kind: 'doorClearance', sceneLabel: `${label} 공간`,
    } satisfies ConsumerCopy];
  })),
};

const FALLBACK: ConsumerCopy = {
  problem: '설치 공간이 모자라요',
  action: (shortage) => `${len(shortage)} 더 필요해요`,
  passLabel: '설치 공간',
  unknown: '확인하지 못했어요',
  region: 'body',
  kind: 'physicalFit',
  sceneLabel: '설치 공간',
};

export function consumerCopyFor(checkId: string): ConsumerCopy {
  return COPY[checkId] ?? FALLBACK;
}

/**
 * True when this check has wording written for it rather than falling back to
 * the generic sentence. `npm run verify` asserts this for every check the
 * engine can emit, so a new check can never reach a shopper unexplained.
 */
export function hasConsumerCopy(checkId: string): boolean {
  return Object.hasOwn(COPY, checkId);
}

/**
 * Headline wording. The enum name never reaches the screen.
 *
 * These are HEADLINES, so they are as short as the meaning allows and no
 * shorter - a verdict that fits on one line reads as a decision, and one that
 * wraps reads as a paragraph that happens to be large. What may never be
 * traded away for length is the CERTAINTY: "설치가 어려워요" is as definite as
 * the longer sentence it replaced, and the qualification that used to live in
 * the headline now lives in the note directly beneath it, where a shopper who
 * wants the reasoning is already looking.
 */
export const CONSUMER_VERDICT: Record<InstallationVerdict, { title: string; note: string }> = {
  INSTALLABLE: {
    title: '이 공간에 설치할 수 있어요',
    note: '제품 크기와 공개된 설치 기준을 충족해요.',
  },
  NOT_INSTALLABLE: {
    title: '이 공간에는 설치가 어려워요',
    note: '아래 항목이 해결되면 설치할 수 있어요.',
  },
  PARTIALLY_VERIFIED: {
    title: '아직 확인이 필요해요',
    note: '기준에 못 미친 항목은 없지만, 알려주신 정보만으로 확인하지 못한 부분이 있어요.',
  },
};

/**
 * THE ONE-GLANCE STATE WORD, beside the status dot.
 *
 * Noun phrases rather than sentences: at this size 설치 가능 reads faster than
 * a full clause would, and it is a label beside a dot, not something being
 * said to the shopper. The sentence in `CONSUMER_VERDICT` does the speaking.
 *
 * 조치 필요 was administrative - it told a shopper they had an action item.
 * 공간 부족 says what is actually true.
 *
 * It lived in `ConsumerResult.tsx` as a `VERDICT_WORD` map, and the guided
 * overlay's result preview then carried its own '설치 가능' literal because a
 * component cannot import another component's private constant. Two
 * definitions of one word, in a preview whose entire purpose is to look like
 * the real panel. Here, both read the same entry.
 */
export const CONSUMER_VERDICT_WORD: Record<InstallationVerdict, string> = {
  INSTALLABLE: '설치 가능',
  NOT_INSTALLABLE: '공간 부족',
  PARTIALLY_VERIFIED: '추가 확인',
};

/**
 * The screen before anything has been measured. No verdict, no shortfall, no
 * red geometry - the shopper has not told us about their kitchen yet, so there
 * is nothing to judge.
 */
export const CONSUMER_INITIAL = {
  title: '설치할 공간을 알려주세요',
  note: '지금 보이는 건 예시 공간이에요. 우리 집 치수로 바꾸면 바로 확인해 드릴게요.',
  status: '측정 전',
  /** Beside the figure: the one thing to do next, and where to do it. */
  guide: '왼쪽에서 공간 정보를 입력해 주세요',
  hint: '세 군데 중 한 곳만 알려주셔도 확인할 수 있는 것부터 알려드려요.',
};

/** Consumer-mode UI strings. */
export const CONSUMER_UI = {
  /**
   * ONE NAME PER DESTINATION, AND HERE THAT IS ONE WORD.
   *
   * The defect these replaced was a concept change: the bottom bar said
   * 결과 보기 and the sheet it opened was headed 설치 가능 여부 - a different
   * noun for a different thing.
   *
   * The first fix split them on the argument that a button is something the
   * shopper DOES and a heading is what a screen IS, so the action stayed
   * 결과 보기 and the screen became 설치 결과. That argument holds where the
   * destination is a place with a life of its own. This one is not: the deck
   * at 1199 and below now carries no verdict at all (section 22.17), so the
   * sheet is the ONLY place a result exists and the only way in is pressing
   * one thing. Two nouns for one step is a seam, not a distinction.
   *
   *   action    결과 보기
   *   heading   결과 보기
   *
   * The input side already worked this way for its own reason: 공간 조절 reads
   * as an action and as a place, so it kept one key.
   */
  responsiveInputAction: '공간 조절',
  responsiveResultAction: '결과 보기',
  responsiveResultTitle: '결과 보기',
  /** Leaves the product list for whatever opened it. */
  back: '돌아가기',
  doorSimulationUnavailable: '3D에는 문을 닫은 모습만 표시했어요.',
  manufacturerUnknown: {
    status: '일부 확인',
    door: {
      title: '문 사용 공간은 확인이 어려워요',
      note: '알려주신 치수로 확인한 설치 조건은 충족해요. 제조사가 제공한 정보만으로는 문 열림에 필요한 공간까지 판단하기 어려워요.',
    },
    installation: {
      title: '일부 설치 조건은 확인이 어려워요',
      note: '제조사가 제공한 정보만으로는 아래 설치 조건을 확인하기 어려워요.',
    },
  },
  headline: '우리 집에 설치할 수 있을까요?',
  /**
   * THE SAME SECTION, AT TWO SCALES.
   *
   * The desktop panel heads this section with an instruction - it is the first
   * thing to do and there is room to say it. The responsive sheet arrives
   * already titled 공간 조절, so repeating "재기" under it spends a line saying
   * what the screen just said; a compact label naming the CONTENT is what the
   * sheet wants. Both were kept here rather than one being a literal inside
   * `ConsumerPanel` on a `settings` ternary, which is how the pair could have
   * drifted into two different concepts without anyone noticing.
   */
  step1Title: '설치할 공간 재기',
  step1TitleCompact: '공간 크기',
  step2Title: '주변 환경',
  /*
   * SECONDARY CONTEXT, behind the 주변 환경 heading's info tip.
   *
   * Reworded when it moved: as a permanent line it had to introduce the
   * questions below it ("아래 질문은 모두..."), and a tip that is opened
   * deliberately can answer the actual question instead - which way round is
   * 왼쪽. Read once, never needed again, and nothing goes wrong for a shopper
   * who never opens it, which is the test for moving anything here.
   */
  viewpointNote: '왼쪽·오른쪽은 냉장고를 정면에서 봤을 때 기준이에요.',
  viewpointTipLabel: '왼쪽·오른쪽 기준 설명',
  wallLeftQuestion: '왼쪽에 벽이나 가구가 있나요?',
  wallRightQuestion: '오른쪽에 벽이나 가구가 있나요?',
  wallYes: '있어요',
  wallNo: '없어요',
  placementTitle: '어느 쪽에 붙일까요?',
  /**
   * THE FEATURE'S NAME, for a surface that has no room for a question.
   *
   * The panel asks 어느 쪽에 붙일까요?, which is right where it sits: the third
   * of three questions the shopper answers in a row. A compact chip cannot ask
   * a question - it has to be a noun beside its current value.
   *
   * 배치 위치 is that noun, and it is the feature's existing name. It was
   * written into the component rather than kept here, which is the only thing
   * that was wrong with it; renaming it to 놓을 자리 to match the product's
   * other vocabulary invented a SECOND name for placement, which is a worse
   * problem than the one it solved. One concept, two registers - a question
   * where there is room to ask, the feature's name where there is not.
   */
  placementLabel: '배치 위치',
  placementLeft: '왼쪽',
  placementCentre: '가운데',
  placementRight: '오른쪽',
  /**
   * AFTER A DRAG, NONE OF THE THREE IS TRUE.
   *
   * The appliance is where the shopper put it, so pressing one of the presets
   * would be a claim nobody made - and `aria-pressed` stays off for all three,
   * which is correct. But saying nothing at all left a control with three
   * options and no marks, sitting under two controls that both had one: it
   * read as unanswered, or broken.
   *
   * A note is the quietest thing this product owns, and it is what the two
   * questions above already use to qualify themselves. It states the state
   * without claiming a preset, and it disappears the moment one is chosen.
   */
  placementCustom: '지금은 직접 옮겨 놓은 자리예요.',
  /**
   * The same state as `placementCustom`, as the chip has room to say it. The
   * component said 직접 조절, whose verb belongs to a slider - what the shopper
   * did was drag the appliance, which is the verb the sentence above uses.
   */
  placementCustomShort: '직접 옮김',
  needMore: '더 필요',
  /** Shown in a measurement box that has not been filled in yet. */

  /**
   * Shown while the space on screen is still the example.
   *
   * One line, right where the numbers are. It has to do two jobs at once: say
   * that these are not the shopper's measurements, and say what to do about
   * it. Any longer and it becomes a paragraph nobody reads above a form.
   *
   * The "where do I begin" job now belongs to the first-entry guided overlay
   * (see `GuidedOverlay`), which points at this whole section once, on
   * arrival - so this sentence goes back to stating only the one fact that is
   * true every time it is on screen, measured or not.
   */
  exampleSpace: '예시 공간이에요. 우리 집 치수로 바꿔주세요.',

  /** Shown in a measurement box the shopper has cleared mid-edit. */
  measurementEmpty: '입력',
  productDimensionByAxis: { width: '제품 너비', height: '제품 높이', depth: '제품 깊이' },
  productDimensionUnavailable: '규격 정보가 없어요',

  /**
   * The name of the control module the two view actions live in.
   *
   * It became a real group on screen, so it needs a real name in the
   * accessibility tree too - otherwise a screen reader meets two unrelated
   * buttons where everyone else sees one labelled cluster. The guided
   * overlay's caption for this target reads from here, so the words a
   * shopper is told and the words the group is called cannot drift apart.
   */
  viewerControlsLabel: '화면 보기 조절',
  /** The viewer control that puts the camera back to its default framing. */
  resetView: '기본 시점으로',
  /**
   * Offered once, then never again this session.
   *
   * Names both gestures in one line, because they are the same idea - the
   * things in the room can be handled - and two hints would be two hints.
   */
  dragHint: '냉장고를 좌우로 옮겨볼 수 있어요',
  /** The door control section: adjusting how far a door opens. */
  doorSectionTitle: '문 여는 정도',
  doorAngleLabel: '열림 각도',
  doorClosed: '닫힘',
  doorGroupAll: '전체',
  /** Shown on the compact chip when the leaves are not at one angle. */
  doorAnglesMixed: '개별',
  /** On the measurement heading: these are what the answer is computed from. */
  requiredForResult: '결과 확인에 필요해요',
  /**
   * THE PRIMARY INSTRUCTION FOR EACH MEASUREMENT. Always visible.
   *
   * This is the sentence that decides whether the number a shopper types is
   * the right number, so it is the one thing in the measurement section that
   * could never move behind a tip (PROJECT_SPEC 21.17). The illustration says
   * WHICH direction; only these say WHERE to hold the tape.
   *
   * They were a `SHORT_HINT` map inside `MeasurementNumberField` and two of
   * them called the installation space a 자리 - this product's word for where
   * the appliance STANDS, not for the space being measured (section 19). Same
   * instruction, the catalogue's own noun.
   */
  measurementHint: {
    SPACE_WIDTH: '설치 공간의 좌우 길이. 가장 좁은 곳을 재세요.',
    SPACE_HEIGHT: '바닥부터 위를 막고 있는 것까지.',
    SPACE_DEPTH: '뒷벽부터 설치 공간 앞쪽 끝까지. 이보다 깊으면 앞으로 조금 나와요.',
  } as Record<string, string>,
  /**
   * A shortage label in the scene. WHAT, then HOW MUCH - never the number on
   * its own, which is what left two identical pills above the cabinet with no
   * way to tell which was the appliance and which was the maker's clearance.
   */
  issueAnnotation: (what: string, shortageMm: number) =>
    `${what} · ${formatCmWithUnit(shortageMm)} 부족`,
  /**
   * THE DIMENSION GUIDE IN THE SCENE.
   *
   * Drawn across the alcove while a measurement field is focused, so it is the
   * SAME physical number the box on the left is showing - and it has to read
   * as that number, not as the engine's millimetres. It said `너비 1760mm`
   * beside a box reading `176cm` until v1.48; both the words and the unit were
   * assembled inside `MeasurementGuides3D`, out of reach of every consumer
   * copy and unit rule this module exists to hold.
   */
  sceneAxis: {
    widthMm: '너비',
    heightMm: '높이',
    depthMm: '깊이',
  } as const,
  sceneDimension: (what: string, valueMm: number) => `${what} ${formatCmWithUnit(valueMm)}`,
  /**
   * THE TWO GAPS, WHILE THE APPLIANCE IS BEING DRAGGED.
   *
   * A bare distance does not tell a shopper whether it is enough, so a gap is
   * stated against the manufacturer's requirement wherever there is one. Same
   * reason as `issueAnnotation`, and now the same unit.
   */
  placementNoWall: '벽 없음',
  placementGap: (gapMm: number) => formatCmWithUnit(gapMm),
  placementShort: (shortageMm: number) => `${formatCmWithUnit(shortageMm)} 모자라요`,
  placementSpare: (gapMm: number, spareMm: number) =>
    `${formatCmWithUnit(gapMm)} · ${formatCmWithUnit(spareMm)} 여유`,
  /**
   * The names of the things a shopper still has to tell us, for the note under
   * a not-yet-definite verdict. Spoken register, and the same words the
   * questions themselves use so there is nothing to translate mentally.
   */
  missingInput: {
    widthMm: '설치 공간 너비',
    heightMm: '설치 공간 높이',
    depthMm: '설치 공간 깊이',
  },
  /**
   * WHAT IS STILL MISSING, PROMOTED OUT OF THE CAPTION.
   *
   * This used to be one grey sentence - "설치 공간 높이, 왼쪽 벽 여부, 오른쪽 벽
   * 여부를 알려주시면 바로 확인해 드릴게요." - under the headline, while the
   * evidence that HAD been checked, the door control and the source note all
   * carried more weight below it. Everything the shopper needed was on screen
   * and the one thing they had to act on was the quietest thing there.
   *
   * So the sentence stops enumerating and becomes a lead, and the names move
   * into a list of their own directly beneath it. Said once, in the place it
   * is read first. The names come from `missingConsumerInputs`, so this can
   * never drift from what the verdict is actually waiting on.
   */
  stillNeededLead: '왼쪽에서 아래 항목을 알려주시면 바로 확인해 드려요.',
  /**
   * HOW MANY, SAID FIRST.
   *
   * The list already says exactly which items and the lead sentence already
   * says where to give them - what was missing was the shopper's fastest
   * question, "얼마나 남았지", answered in the same glance as the heading. The
   * count comes from the same `missingInputNames` the list itself is built
   * from, so the two can never disagree.
   */
  stillNeededTitle: (count: number) =>
    count === 1 ? '아직 1가지만 확인하면 돼요' : `아직 ${count}가지만 확인하면 돼요`,
  /**
   * Nothing for the shopper to do: the maker has not published enough.
   *
   * BOTH HALVES, IN ORDER. The old sentence led with what failed to happen and
   * then reassured about the shopper's input, which left the actual state of
   * play - most of the check passed, one part could not be attempted - to be
   * inferred from the list underneath. This states what was settled first,
   * because that is the larger and better half of the answer, then names whose
   * gap the remainder is and points at the list that enumerates it.
   *
   * Safe to say unconditionally in this branch: a PARTIAL verdict with no
   * consumer input outstanding means every check that could be decided PASSED
   * - a failure would have made the verdict NOT_INSTALLABLE instead.
   */
  /**
   * WHAT WAS CHECKED, AND WHAT IS LEFT - not why the engine could not check it.
   *
   * It read "알려주신 치수로 확인할 수 있는 항목은 모두 문제가 없어요. 다만
   * 제조사가 공개하지 않은 자료가 있어 아래 항목은 확인하지 못했어요." The
   * middle clause is the reason, and the reason was ALSO under the heading
   * below, ALSO on every unconfirmed row, and ALSO in the door control - four
   * times on one screen. A shopper reading a PARTIAL result needs the extent
   * first and the cause on request (PROJECT_SPEC 21.17), so the cause moved
   * to the one info tip on the section it belongs to and the lead says the
   * two things it is actually for.
   */
  missingProductDataNote:
    '알려주신 치수로 확인할 수 있는 항목은 모두 문제가 없어요. 다만 아래 항목은 추가 확인이 필요해요.',
  /**
   * WHY, on request. One tip for the whole list rather than one line per row:
   * the cause is the same for every row it covers, and repeating it made the
   * left and right doors look like two different problems.
   */
  uncheckedReasonTipLabel: '확인하지 못한 이유',
  /**
   * The cause, in this product's voice rather than the engine's.
   *
   * Each row above already names WHAT could not be confirmed, so this only
   * has to say WHY - and for a row whose inputs are all present there is one
   * why: the maker has not published the figure the check needs. It replaces
   * `check.reason`, which said things like "제조사가 도어에 필요한 좌우 여유
   * 공간을 공개하지 않았습니다" - the right fact, in the ~습니다 register no
   * other consumer line uses, naming the field the calculation wanted.
   *
   * Nothing is lost: the per-check reason is still on every check, still in
   * the developer table, and still the thing the engine reasons about. This
   * is the shopper's route to the same truth (PROJECT_SPEC 21.17).
   */
  uncheckedReason: '제조사가 이 항목을 확인할 기준을 공개하지 않았어요.',
  /** The manufacturer-backed range used by the door interaction. */
  doorPublishedAngle: (deg: number) => `제조사 공개 개방각 ${deg}°`,
  doorOpenMax: '제조사 공개 개방각으로 열어보기',
  /**
   * The scene-level shortcut. Every leaf, each to its OWN limit.
   *
   * It read 문 열어보기 here and nothing imported it, while the button a
   * shopper actually presses said 전체 문 열기, written into `ViewerControls`.
   * Two names for one control, one of them invisible. The rendered one is
   * kept - it is the one that says the control acts on every door, which is
   * what distinguishes it from `doorOpen` below - and the component now reads
   * it from here.
   */
  doorOpenMaxAll: '전체 문 열기',
  /** One leaf, from the pointer that is already on it in the scene. */
  doorOpen: '문 열기',
  doorClose: '문 닫기',
  /** Show an authoritative clearance shortfall alongside the independent door interaction. */
  doorBasis: {
    manufacturerShort: (maker: string) =>
      `${maker} 공식 기준으로는 문을 열 공간이 모자라요.`,
  },
  /** Published side-clearance provenance, available on request. */
  doorBasisDetail: {
    manufacturerMet: (maker: string) => `문 여는 공간은 ${maker} 공식 기준으로 확인했어요.`,
    manufacturerShort: (maker: string) => `${maker}에서 공개한 문 여는 공간 기준이에요.`,
  },
  doorBasisTipLabel: '문 여는 공간 기준 설명',

  /** The entry layer: choosing which appliance to check. */

  entryHeadline: '어떤 냉장고를 확인할까요?',

  entryNote: '제품을 고르면 우리 집 공간에 들어가는지 확인해 드려요.',

  entryEmpty: '지금은 확인할 수 있는 제품이 없어요.',

  /**
   * THE SPACE SETUP SCREEN — the step between choosing a product and the 3D.
   *
   * These three were written into `SpaceSetup.tsx`, which is how the note came
   * to call the installation space a 자리. In this product's vocabulary 자리 is
   * where the appliance STANDS and 공간 is the space being measured (section
   * 19), and the check that enforces that walks this module - so a sentence
   * kept in a component was the one place the rule could not reach.
   *
   * The heading keeps its own 내 공간: it is the shopper's side of the same
   * noun, it pairs with the submit button directly beneath it, and it is the
   * one screen whose whole job is to ask.
   */
  setupTitle: '내 공간을 알려주세요',
  setupNote: '설치할 공간의 크기를 입력하면 냉장고가 들어가는지 확인해요.',
  /**
   * TWO CONFIRM BUTTONS, AND WHY THEY ARE NOT THE SAME SENTENCE.
   *
   * Both commit the measurements and put the shopper in front of the 3D, so
   * they share the verb. What differs is where the shopper is standing.
   *
   *   setupSubmit    the gate. Nobody has seen the 3D yet, so it cannot be
   *                  named as a destination; what the shopper is buying with
   *                  this press is their own space.
   *   confirmInSpace the return. The shopper came FROM the 3D to adjust a
   *                  number, and this takes them back to it.
   *
   * Kept apart deliberately, and kept next to each other so the next change to
   * either is made looking at both.
   */
  setupSubmit: '내 공간에서 확인하기',
  confirmInSpace: '3D에서 확인하기',

  /** Offered only once the catalogue is large enough to be worth searching. */

  /**
   * NAMES ONLY A SCREEN READER HEARS, and the reason they are here anyway.
   *
   * Nothing renders them as text, so no visual review would ever catch one
   * drifting from what everybody else can see - which is precisely why they
   * belong beside the copy they have to agree with.
   */
  productListLabel: '제품 목록',
  stagePreview: '미리보기',
  stageSelect: '선택',
  stageKeys: '좌우 방향키로 탐색하고 Enter 또는 Space로 선택해요.',
  home: '홈으로 이동',

  searchPlaceholder: '제품명 또는 모델명으로 찾기',

  searchNoMatch: '찾는 제품이 없어요. 검색어를 바꿔 다시 확인해 주세요.',

  /**
   * THE BRAND FILTER (F-049).
   *
   * The options are the manufacturers' own names, which come from the
   * catalogue - the only word written here is the resting one. It names the
   * whole catalogue rather than an absence, because that is what it selects.
   *
   * The group is labelled for a screen reader only. On screen the options say
   * 전체 · Samsung · LG · Liebherr, and a row of manufacturer names under a
   * search box needs no heading to explain itself; adding one would spend a
   * line of the card saying what the control already says.
   */
  brandFilterLabel: '브랜드',

  brandFilterAll: '전체',

  /** When a brand is chosen and nothing inside it matches what was typed. */
  brandFilterNoMatch: '이 브랜드에는 찾는 제품이 없어요. 브랜드나 검색어를 바꿔 주세요.',

  /** The action, not the destination: the button changes the product. */
  changeProduct: '제품 변경',
  /**
   * The next action after a result.
   *
   * NOT_INSTALLABLE is the case that needs one: the shopper cannot change their
   * kitchen, so the realistic move is a different appliance - and the space they
   * already gave us survives the switch. PARTIALLY_VERIFIED's next action is
   * finishing the inputs, which the panel beside it already is. INSTALLABLE
   * gets none: there is no checkout here, and inventing a 구매하기 button that
   * leads nowhere would be worse than silence.
   */
  tryAnotherProduct: '다른 제품 확인하기',
  projectsOut: '앞으로 나옴',
  unbounded: '제한 없음',
  /**
   * A gap the appliance has already eaten into.
   *
   * `availableMm` is "space the user actually has", and below zero that is
   * none of it - the cabinet and the wall overlap. Printing the signed number
   * asked a shopper to read "현재 -4.8cm" as an amount of gap, which is not a
   * thing anyone can picture. The shortfall above the line still says how much
   * is missing, so nothing is lost by naming this honestly.
   */
  noneAvailable: '없음',
  current: '현재',
  needed: '필요',
  /**
   * Whose rule it is.
   *
   * Takes the manufacturer from the product, because the catalogue now holds
   * more than one: crediting Samsung for another brand's figures would be
   * attributing data to a company that never published it.
   */
  sourceNote: (manufacturer: string) => `${manufacturer} 공식 설치 기준으로 확인했어요.`,
  /** When the record names no manufacturer, we do not invent one. */
  sourceNoteUnknown: '제조사가 공개한 설치 기준으로 확인했어요.',
  /*
   * THE SAME PROVENANCE, SCOPED TO WHAT WAS ACTUALLY CHECKED.
   *
   * The line above is a claim about coverage as much as about authorship, and
   * under a headline that reads 아직 확인이 필요해요 it contradicted it: the panel
   * said it could not confirm everything and then signed off as though it had.
   * These say whose figures were used WITHOUT saying everything was settled.
   * No new source, no new status - the same manufacturer standard, described
   * at its real extent.
   */
  sourceNotePartial: (manufacturer: string) =>
    `확인한 항목은 ${manufacturer} 공식 설치 기준으로 확인했어요.`,
  sourceNotePartialUnknown: '지금까지 확인한 항목은 제조사가 공개한 설치 기준을 따랐어요.',
  /**
   * THE WAY TO CHECK THE SENTENCE ABOVE IT.
   *
   * "공식 설치 기준으로 확인했어요" asks to be believed. This is the shopper's
   * route to the document it was read from - offered quietly, because someone
   * who simply wants the answer has already had it, and someone who wants to
   * see the maker's own page will look for exactly this.
   *
   * The visible label says nothing about which product: it sits directly under
   * a sentence naming the manufacturer, inside a panel about one appliance.
   * A screen reader gets the context the eye already has.
   */
  sourceLink: '공식 사이트 확인',
  sourceLinkLabel: (brand: string, model: string) => `${brand} ${model} 공식 설치 정보 확인`,

  /** Heading over the checks that came back fine. Always shown, never folded. */
  /** Heading over the manufacturer's installation instructions. */
  guidanceTitle: '설치할 때 참고하세요',
  uncheckedTitle: '확인하지 못한 항목',


} as const;

/**
 * THE FIRST-ENTRY GUIDED OVERLAY (see `GuidedOverlay.tsx`).
 *
 * Two steps, once per session, said the way this product already speaks
 * elsewhere: a plain sentence, not an instruction manual. No step counter in
 * the copy itself - the button label is the only thing that changes between
 * "there is another step" and "this is the end" (다음 / 확인).
 */
export const CONSUMER_GUIDED_OVERLAY = {
  inputTitle: '내 공간에 맞게 조절해 보세요',
  inputBody: '치수를 바꾸거나 주변 벽을 조정하면서 설치 가능 여부를 확인해 보세요.',
  resultTitle: '여기서 설치 결과를 확인해요',
  resultBody: '입력한 정보를 기준으로 설치 가능 여부와 필요한 내용을 보여드릴게요.',
  /**
   * The third region: the two controls that act on the VIEW.
   *
   * Named for what those buttons actually are, because that is what the
   * shopper will press. A "제품만 보기 / 공간에 배치된 모습" view-mode toggle
   * does not exist in this product, and labelling this cluster as one would be
   * describing a feature that is not there.
   */
  viewTitle: '직접 움직여 볼 수 있어요',
  viewBody: '냉장고를 움직이고 화면을 돌려보면서 공간을 여러 각도에서 확인해 보세요.',
  controlsTitle: '빠르게 조작할 수 있어요',
  controlsBody: '문을 한 번에 열거나 처음 시점으로 돌아갈 수 있어요.',
  controlsResetBody: '처음 시점으로 돌아가 냉장고와 공간을 다시 살펴볼 수 있어요.',
  presentationNote: '사용법을 안내하는 예시 공간이에요. 시작하면 내 공간으로 돌아가요.',
  action: '시작하기',
  /** Read by assistive tech when the overlay opens; not shown as text. */
  announce: '들임 사용법 안내: 설치 결과를 확인하고, 3D 화면과 냉장고를 직접 움직여볼 수 있어요.',

  /**
   * THE RESULT PREVIEW.
   *
   * Copy for an ILLUSTRATION of the finished result, shown over the real
   * result panel while the overlay is open - never a verdict about anyone's
   * kitchen, which is why it carries `exampleLabel` and why no manufacturer
   * figure appears in it. The sentences themselves come from
   * `CONSUMER_VERDICT.INSTALLABLE` so the preview cannot drift from what the
   * real panel says; only the status word and the row labels live here,
   * because the result builds those from engine state this must not touch.
   */
  preview: {
    exampleLabel: '예시',
    /** The real panel's own word, not a copy of it. */
    status: CONSUMER_VERDICT_WORD.INSTALLABLE,
  },
} as const;

/** The one-step guide for responsive 3D and task navigation. */
export const CONSUMER_RESPONSIVE_ONBOARDING = {
  viewBody: '냉장고를 옮기고 화면을 돌려보세요.',
  /*
   * THE OTHER HALF OF THE SCREEN, SAID AT THE SAME TIME.
   *
   * It used to say 아래에서 설치 결과를 확인해요, which was true while the deck
   * carried a verdict. It does not any more: the answer lives in the result
   * sheet alone, and the deck is where a shopper changes the two things that
   * can change it. Describing it as a results area would send someone looking
   * down there for a sentence that is no longer written there.
   *
   * It names the two controls because they ARE the region now - a deck of a
   * product row, two settings and one action is fairly described by the
   * settings - and it ends on the way out, which is the action itself.
   */
  panelTitle: '아래에서 설정을 조절할 수 있어요',
  panelBody: '배치와 문 여는 정도를 바꾸고 결과를 확인해 보세요.',
} as const;
