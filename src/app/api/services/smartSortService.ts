import { SharedList } from "./sharedListRepository";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const SYSTEM_PROMPT = 
`
You are an assistant that list items into one category each.
The items might be in any and multiple languages and they might be whimsical or not be grammatically correct.
I want you to create a json of type sortedItems: [{itemId: string, categoryId: string}] where the category of the item is your best guess and the ids match the item in the input item array.
If you feel like the item doesn't correctly fit into any category, you may set the categoryId to null. Include only the JSON as your answer.
`
const SORTED_ITEMS_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "array",
    items: {
    type: "object",
    properties: {
        itemId:    {"type": "string"},
        categoryId: {
            "anyOf": [
                {"type": "number"},
                {"type": "null"}
            ]
        }
    },
    required: ["itemId", "categoryId"],
    additionalProperties: false
    }
}

const OUTPUT_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
        sortedItems: SORTED_ITEMS_SCHEMA,
    },
    required: ["sortedItems"],
    additionalProperties: false
}

const client = new OpenAI({apiKey: OPENAI_API_KEY});

export async function getListItemsSortedIntoCategories(list: SharedList): Promise<SortedItemsByCategory | null>{
    const items = list.items.map(item => {return {id: item._id, name: item.text}})
    const categories = list.categories

    const response = await client.responses.parse({
        model: "gpt-5-nano",        
        text: {
            format: {type: "json_schema", name: "SortedItemsByCategory", schema: OUTPUT_SCHEMA}
        },

        input: [
            {role: "system", content: SYSTEM_PROMPT},
            {role: "user", content: `items: ${JSON.stringify(items)}, categories: ${JSON.stringify(categories)}`}
        ]
    })

    const sortedItems = response.output_parsed ? (response.output_parsed as {sortedItems: SortedItemsByCategory}) : null;

    return sortedItems?.sortedItems ?? null;
}

export type SortedItemsByCategory = [{
    itemId: string,
    categoryId: number
}]

export async function main(){
    const list: SharedList = {
        _id: "testid123",
        name: "testList",
        version: 1,
        owner: "testowner@mail.com",
        viewers: [],
        items: [
            {_id: "1a", position: 100, checked: false, text: "1kg apples"},
            {_id: "2a", position: 200, checked: false, text: "salde"},
            {_id: "3a", position: 300, checked: false, text: "halloum"},
            {_id: "4a", position: 400, checked: false, text: "bansku"},
            {_id: "5a", position: 500, checked: false, text: "kasvispullat"},
            {_id: "6a", position: 600, checked: false, text: "sipsii"},
            {_id: "7a", position: 700, checked: false, text: "onion"},
            {_id: "8a", position: 800, checked: false, text: "maitorahka"},
            {_id: "9a", position: 900, checked: false, text: "leibä"},
            {_id: "10a", position: 1000, checked: false, text: "tomsku"},
            {_id: "11a", position: 1100, checked: false, text: "hammastahna"},
            {_id: "12a", position: 1200, checked: false, text: "tortillat x24"},
            {_id: "13a", position: 1300, checked: false, text: "250g suklaata"},
        ],
        categories: [
            {id: 1, position: 100, icon: "🍎", description: "fresh produce", examples: ["apples", "apple", "appe", "omenia", "omppuja"]},
            {id: 2, position: 200, icon: "❄", description: "frozen", examples: ["jätskii", "kasvispullat", "kalapuikot", "pakastepizza"]},
            {id: 3, position: 300, icon: "🍔", description: "meals", examples: ["kolmioleipii"]},
            {id: 4, position: 400, icon: "🧀", description: "dairy", examples: ["juusto", "halloum", "milk", "rahka", "raaste"]},
            {id: 5, position: 500, icon: "🌮", description: "texmex", examples: ["lätyt", "tortilla", "nachot", "salsa"]},
            {id: 6, position: 600, icon: "🥫", description: "canned food", examples: ["papuja", "beans", "kikherne", "suolakurkku"]},
            {id: 7, position: 700, icon: "🦷", description: "hygiene", examples: ["hampitahna", "toothbrush", "shampoo f"]},
            {id: 8, position: 800, icon: "🍫", description: "sweets", examples: ["fazerin sininen", "tumma suklaa", "dark choco", "mässyy"]},
            {id: 9, position: 900, icon: "🥜", description: "snacks", examples: ["sips", "sipsi", "poppari", "popcorn", "nuts"]},
            {id: 10, position: 1000, icon: "🧼", description: "household", examples: ["käsisaiuppa", "wc paperi", "economypaper", "talouspaperi"]},
            {id: 11, position: 1100, icon: "🥤", description: "drinks", examples: ["kokis", "coke", "vesi", "fanta vihree"]},
            {id: 12, position: 1200, icon: "🍷", description: "alcohol", examples: ["wine", "viini", "viina", "maraschino", "valkkari", "punkku", "red wine"]},
            {id: 13, position: 1300, icon: "🍞", description: "bread", examples: ["bread", "bred", "leib", "leipää", "ruisleipä"]},
        ]
    }

    const res = await getListItemsSortedIntoCategories(list)
    console.log(res);
    const items = res?.map((item) => {
        const originalItem = list.items.find((i) => i._id === item.itemId);
        const originalCategory = list.categories.find(c => c.id === item.categoryId)
        return {
            item: originalItem,
            category: originalCategory
        }
    });
    items?.sort((a,b) => (a.category?.id ?? 0) < (b.category?.id ?? 0)  ? -1 : ((a.category?.id ?? 0) > (b.category?.id ?? 0) ? 1 : 0))
    items?.forEach(i => {
        console.log("%s -> %s %s", i.item?.text, i.category?.icon, i.category?.description)
    })
}

if (typeof require !== "undefined" && require.main === module) {
  main().catch(console.error)
}